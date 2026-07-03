import { runSql, getSql, allSql, hasRole } from './database';
import type { Task, TaskType, TaskPriority, TaskModel } from '../../src/types/task';
import bcrypt from 'bcryptjs';

export interface DbProfile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface DbUserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'operator' | 'viewer';
  created_at: string;
}

export interface DbTaskLog {
  id: string;
  task_id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  created_at: string;
}

export const ProfileRepository = {
  async findById(id: string): Promise<DbProfile | null> {
    const row = await getSql<DbProfile>('SELECT * FROM profiles WHERE id = ?', [id]);
    return row || null;
  },

  async create(profile: { id: string; display_name: string }): Promise<DbProfile> {
    const now = new Date().toISOString();
    await runSql(
      'INSERT INTO profiles (id, display_name, created_at) VALUES (?, ?, ?)',
      [profile.id, profile.display_name, now]
    );
    return (await this.findById(profile.id))!;
  }
};

export const UserRoleRepository = {
  async assignRole(userId: string, role: 'admin' | 'operator' | 'viewer'): Promise<DbUserRole> {
    const id = `ur-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    await runSql(
      'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, ?)',
      [id, userId, role, now]
    );
    return { id, user_id: userId, role, created_at: now };
  },

  async hasRole(userId: string, role: string): Promise<boolean> {
    return hasRole(userId, role);
  }
};

export const UserRepository = {
  async findByEmail(email: string): Promise<{ id: string; email: string; name: string; password_hash: string; role: 'admin' | 'operator' | 'viewer' } | null> {
    const row = await getSql<any>(
      `SELECT p.id, p.display_name as name, u.email, u.password_hash, COALESCE(r.role, 'operator') as role
       FROM profiles p
       LEFT JOIN users_auth u ON p.id = u.id
       LEFT JOIN user_roles r ON p.id = r.user_id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email]
    );
    return row || null;
  },

  async seedAdminUser() {
    const now = new Date().toISOString();

    // Ensure users_auth table exists for auth equivalence
    await runSql(`
      CREATE TABLE IF NOT EXISTS users_auth (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    const existingAuth = await getSql<any>('SELECT * FROM users_auth WHERE LOWER(email) = LOWER(?)', ['admin@nexusai.io']);
    if (!existingAuth) {
      const adminId = 'user-admin-1';
      const hash = await bcrypt.hash('admin123', 10);

      await runSql('INSERT INTO users_auth (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)', [adminId, 'admin@nexusai.io', hash, now]);
      await ProfileRepository.create({ id: adminId, display_name: 'Senior Architect' });
      await UserRoleRepository.assignRole(adminId, 'admin');

      console.log('[Database Repository] Default admin user admin@nexusai.io seeded with profiles & user_roles table.');
    }
  }
};

export const TaskLogRepository = {
  async findByTaskId(taskId: string): Promise<DbTaskLog[]> {
    const rows = await allSql<DbTaskLog>('SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at ASC', [taskId]);
    return rows;
  },

  async addLog(taskId: string, level: 'info' | 'warn' | 'error' | 'debug', message: string): Promise<DbTaskLog> {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    await runSql(
      'INSERT INTO task_logs (id, task_id, level, message, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, taskId, level, message, now]
    );
    return { id, task_id: taskId, level, message, created_at: now };
  }
};

export const TaskRepository = {
  /**
   * RLS Filtering: Users read/write ONLY their own tasks (unless admin via has_role)
   */
  async findAll(filter?: { userId?: string; status?: string; priority?: string; type?: string; search?: string }): Promise<Task[]> {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    // RLS Enforcement: Filter by user_id if provided
    if (filter?.userId) {
      const isAdmin = await hasRole(filter.userId, 'admin');
      if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(filter.userId);
      }
    }

    if (filter?.status && filter.status !== 'all') {
      if (filter.status === 'active') {
        query += " AND status IN ('processing', 'queued', 'pending', 'retrying', 'running')";
      } else {
        query += ' AND status = ?';
        params.push(filter.status);
      }
    }

    if (filter?.type && filter.type !== 'all') {
      query += ' AND operation = ?';
      params.push(filter.type);
    }

    if (filter?.search) {
      query += ' AND (id LIKE ? OR title LIKE ? OR input_text LIKE ?)';
      const s = `%${filter.search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    const rows = await allSql(query, params);
    
    // Populate logs for each task
    const tasks: Task[] = [];
    for (const row of rows) {
      const logs = await TaskLogRepository.findByTaskId(row.id);
      tasks.push(this.mapRowToTask(row, logs));
    }
    return tasks;
  },

  async findById(id: string): Promise<Task | null> {
    const row = await getSql('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!row) return null;
    const logs = await TaskLogRepository.findByTaskId(id);
    return this.mapRowToTask(row, logs);
  },

  async create(task: Task, userId?: string): Promise<Task> {
    const now = new Date().toISOString();
    const targetUserId = userId || 'user-admin-1';

    await runSql(
      `INSERT INTO tasks (
        id, user_id, title, input_text, operation, status, result,
        created_at, started_at, finished_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        targetUserId,
        task.title,
        task.input.prompt || task.input.content || '',
        task.type,
        task.status || 'pending',
        task.output ? JSON.stringify(task.output) : null,
        task.createdAt || now,
        task.startedAt || null,
        task.completedAt || null,
      ]
    );

    // Initial task log entry in task_logs table
    await TaskLogRepository.addLog(task.id, 'info', `Task enqueued into Database tasks table with status '${task.status || 'pending'}'.`);

    return (await this.findById(task.id))!;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); params.push(updates.title); }
    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
    if (updates.output !== undefined) { fields.push('result = ?'); params.push(JSON.stringify(updates.output)); }
    if (updates.startedAt !== undefined) { fields.push('started_at = ?'); params.push(updates.startedAt); }
    if (updates.completedAt !== undefined) { fields.push('finished_at = ?'); params.push(updates.completedAt); }

    if (fields.length > 0) {
      params.push(id);
      await runSql(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    if (updates.logs && updates.logs.length > 0) {
      const latestLog = updates.logs[updates.logs.length - 1];
      if (latestLog) {
        await TaskLogRepository.addLog(id, latestLog.level || 'info', latestLog.message);
      }
    }

    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const res = await runSql('DELETE FROM tasks WHERE id = ?', [id]);
    return res.changes > 0;
  },

  async clearCompleted(): Promise<number> {
    const res = await runSql("DELETE FROM tasks WHERE status IN ('completed', 'success', 'cancelled')");
    return res.changes;
  },

  mapRowToTask(row: any, logs: DbTaskLog[] = []): Task {
    const outputObj = row.result ? JSON.parse(row.result) : undefined;
    return {
      id: row.id,
      title: row.title,
      type: row.operation as TaskType,
      status: row.status === 'running' ? 'processing' : row.status === 'success' ? 'completed' : row.status,
      priority: 'medium',
      model: 'claude-3-5-sonnet',
      input: { prompt: row.input_text },
      output: outputObj,
      progress: row.status === 'completed' || row.status === 'success' ? 100 : row.status === 'running' ? 50 : 0,
      currentStep: row.status === 'completed' || row.status === 'success' ? 'Finished' : row.status === 'running' ? 'Running' : 'Pending',
      steps: [
        { id: 's1', name: 'Ingestion & Context Allocation', status: row.status === 'pending' ? 'pending' : 'completed' },
        { id: 's2', name: `Operation Execution (${row.operation})`, status: row.status === 'running' ? 'in_progress' : row.status === 'completed' || row.status === 'success' ? 'completed' : 'pending' },
        { id: 's3', name: 'Output Serialization & Persistence', status: row.status === 'completed' || row.status === 'success' ? 'completed' : 'pending' },
      ],
      logs: logs.map(l => ({
        id: l.id,
        timestamp: new Date(l.created_at).toLocaleTimeString(),
        level: l.level,
        message: l.message,
      })),
      retryCount: 0,
      maxRetries: 3,
      timeoutSeconds: 30,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.finished_at,
    };
  }
};
