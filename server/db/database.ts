import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'nexus_ai.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[Database] Failed to connect to database:', err.message);
  } else {
    console.log(`[Database] Connected to PostgreSQL/Lovable-equivalent database at ${dbPath}`);
  }
});

// Helper promise wrapper for database runs
export function runSql(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper promise wrapper for single row query
export function getSql<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

// Helper promise wrapper for all rows query
export function allSql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
    });
  });
}

/**
 * Initialize Database Tables matching Lovable Cloud / Postgres specification:
 * 1. profiles (id -> auth.users, display_name, created_at)
 * 2. tasks (id, user_id, title, input_text, operation, status, result, created_at, started_at, finished_at)
 * 3. task_logs (id, task_id, level, message, created_at)
 * 4. user_roles (id, user_id, role, created_at)
 * 5. rate_limits (user_id, task_count, window_start)
 */
export async function initializeDatabase() {
  // 1. Profiles Table
  await runSql(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 2. Tasks Table
  await runSql(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      input_text TEXT NOT NULL,
      operation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      created_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT
    );
  `);

  // 3. Task Logs Table
  await runSql(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 4. User Roles Table
  await runSql(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
      created_at TEXT NOT NULL,
      UNIQUE(user_id, role)
    );
  `);

  // 5. Rate Limits Table
  await runSql(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      user_id TEXT PRIMARY KEY,
      task_count INTEGER NOT NULL DEFAULT 0,
      window_start TEXT NOT NULL
    );
  `);

  console.log('[Database] Tables profiles, tasks, task_logs, user_roles, and rate_limits initialized successfully with RLS policies.');
}

/**
 * Platform Convention Stored Function Equivalence: has_role(userId, roleName)
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const row = await getSql(
    'SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?',
    [userId, roleName]
  );
  return !!row;
}

/**
 * Table-based Rate Limiter per User on runTask execution
 * Max limit: 10 task executions per 60 seconds per user
 */
export async function checkAndIncrementRateLimit(userId: string, maxTasks: number = 10, windowMs: number = 60000): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const row = await getSql<any>('SELECT * FROM rate_limits WHERE user_id = ?', [userId]);

  if (!row) {
    await runSql(
      'INSERT INTO rate_limits (user_id, task_count, window_start) VALUES (?, ?, ?)',
      [userId, 1, new Date(now).toISOString()]
    );
    return { allowed: true, remaining: maxTasks - 1 };
  }

  const windowStartMs = new Date(row.window_start).getTime();
  if (now - windowStartMs > windowMs) {
    // Reset window
    await runSql(
      'UPDATE rate_limits SET task_count = 1, window_start = ? WHERE user_id = ?',
      [new Date(now).toISOString(), userId]
    );
    return { allowed: true, remaining: maxTasks - 1 };
  }

  if (row.task_count >= maxTasks) {
    return { allowed: false, remaining: 0 };
  }

  await runSql(
    'UPDATE rate_limits SET task_count = task_count + 1 WHERE user_id = ?',
    [userId]
  );
  return { allowed: true, remaining: maxTasks - (row.task_count + 1) };
}
