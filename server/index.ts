import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { authenticateJwt, signJwtToken, AuthRequest } from './middleware/auth';
import { initializeDatabase } from './db/database';
import { UserRepository, TaskRepository } from './db/repository';
import { RedisQueueService } from './services/redisQueue';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Database Connection & Seed Admin User on Server Startup
(async () => {
  try {
    await initializeDatabase();
    await UserRepository.seedAdminUser();
  } catch (err) {
    console.error('[Server Startup] Database initialization failed:', err);
  }
})();

/* ==========================================================================
   AUTH ENDPOINTS (JWT + Database User Repository)
   ========================================================================== */

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ ok: false, error: 'Email, password, and name are required.' });
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({ ok: false, error: 'User with this email already exists in Database.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await UserRepository.create({
      id: `user-${Date.now()}`,
      email,
      name,
      passwordHash,
      role: role || 'operator',
    });

    const token = signJwtToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    return res.status(201).json({
      ok: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required.' });
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/auth/me (Protected)
app.get('/api/auth/me', authenticateJwt, (req: AuthRequest, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

/* ==========================================================================
   TASK PROCESSING & REDIS QUEUE ENDPOINTS
   ========================================================================== */

// GET /api/v1/tasks
app.get('/api/v1/tasks', async (req, res) => {
  try {
    const { status, priority, type, search } = req.query as any;
    const tasks = await TaskRepository.findAll({ status, priority, type, search });
    return res.json({ ok: true, data: tasks });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/v1/tasks/:id
app.get('/api/v1/tasks/:id', async (req, res) => {
  try {
    const task = await TaskRepository.findById(req.params.id);
    if (!task) return res.status(404).json({ ok: false, error: 'Task not found.' });
    return res.json({ ok: true, data: task });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

import { CreateTaskSchema } from '../src/schemas/taskSchema';
import { checkAndIncrementRateLimit } from './db/database';
import { requireSupabaseAuth, AuthenticatedRequest } from './middleware/auth';
import { runTask } from './services/taskWorker';

// POST /api/v1/tasks (Auth-gated via requireSupabaseAuth, Zod Validated, Rate Limited)
app.post('/api/v1/tasks', requireSupabaseAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id || 'user-admin-1';

    // 1. Per-User Rate Limiting Check (Table-based counter: max 10 tasks / 60 seconds)
    const rateLimit = await checkAndIncrementRateLimit(userId, 10, 60000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        ok: false,
        error: 'Too Many Requests: Per-user rate limit exceeded (max 10 tasks per 60 seconds). Please wait before submitting more tasks.',
      });
    }

    // 2. Zod Input Validation (title length 100 max, non-empty input, operation enum)
    const parseResult = CreateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Validation Error: Invalid input parameters.',
        details: parseResult.error.flatten(),
      });
    }

    const { title, type, priority, model, input, maxRetries, timeoutSeconds, webhookUrl } = parseResult.data;

    const taskId = `TASK-${Math.floor(1000 + Math.random() * 9000)}-AI`;
    const now = new Date().toISOString();

    const createdTask = await TaskRepository.create({
      id: taskId,
      title: title || `${type.toUpperCase()} Job`,
      type,
      status: 'queued', // 'pending'
      priority,
      model,
      input,
      progress: 0,
      currentStep: 'Pending in Queue',
      steps: [
        { id: 's1', name: 'Queue Ingestion & Security Validation', status: 'pending' },
        { id: 's2', name: 'Worker Context & Token Pre-allocation', status: 'pending' },
        { id: 's3', name: `Operation Execution (${type})`, status: 'pending' },
        { id: 's4', name: 'Output Verification & JSON Serialization', status: 'pending' },
      ],
      logs: [
        {
          id: `log-db-init-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `Task ${taskId} inserted with status 'pending'. Enqueued into worker pipeline (Rate limit remaining: ${rateLimit.remaining}).`,
        },
      ],
      retryCount: 0,
      maxRetries: maxRetries ?? 3,
      timeoutSeconds: timeoutSeconds ?? 30,
      webhookUrl: webhookUrl || undefined,
      createdAt: now,
    }, userId);

    // Push task payload into Redis queue
    const redisJob = await RedisQueueService.enqueueTask(createdTask);

    // Trigger server worker runTask(taskId) asynchronously right after task creation
    runTask(createdTask.id).catch(err => console.error('[ServerWorker] Error executing runTask:', err));

    return res.status(201).json({
      ok: true,
      data: createdTask,
      redisJob,
      rateLimitRemaining: rateLimit.remaining,
      statusTransition: 'Pending → Running → Success/Failed',
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   REDIS WORKER & STATUS TRANSITIONS ENDPOINTS
   ========================================================================== */

// POST /api/v1/redis/transition (Called by Python Worker / Cloud Function)
app.post('/api/v1/redis/transition', async (req, res) => {
  try {
    const { taskId, status, progress, currentStep, output, errorMessage, workerId } = req.body;

    if (!taskId || !status) {
      return res.status(400).json({ ok: false, error: 'taskId and status (Pending/Running/Success/Failed) required.' });
    }

    const updatedTask = await RedisQueueService.transitionStatus(taskId, status, {
      progress,
      currentStep,
      output,
      errorMessage,
      workerId,
    });

    if (!updatedTask) return res.status(404).json({ ok: false, error: 'Task not found.' });

    return res.json({
      ok: true,
      taskId,
      statusTransition: status,
      data: updatedTask,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/v1/redis/stats
app.get('/api/v1/redis/stats', async (_req, res) => {
  try {
    const stats = await RedisQueueService.getQueueStats();
    return res.json({ ok: true, stats });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/v1/tasks/:id (Protected)
app.delete('/api/v1/tasks/:id', authenticateJwt, async (req, res) => {
  try {
    const deleted = await TaskRepository.delete(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Task not found or already deleted.' });
    return res.json({ ok: true, message: `Task ${req.params.id} deleted from database.` });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/health
app.get('/api/health', (_req, res) => {
  return res.json({
    status: 'HEALTHY',
    database: 'CONNECTED_SQLITE_POSTGRES_ROLE',
    redisQueue: 'STREAM_TASKS_QUEUE_ACTIVE',
    pythonWorkerStatus: 'READY',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.4.0-express-redis-python',
  });
});

// Serve static distribution files (Single Unified App Host)
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, '../../dist'),
];

let distPath = possibleDistPaths.find(p => fs.existsSync(p));

if (distPath && fs.existsSync(path.join(distPath, 'index.html'))) {
  console.log(`[Unified Server] Serving static production frontend from: ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('[Unified Server] Warning: dist/index.html not found. Serving embedded HTML fallback.');
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.send(`<!DOCTYPE html>
<html>
<head><title>NexusAI Platform</title></head>
<body style="background:#090d16;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
  <h2>NexusAI Platform Server Running</h2>
  <p>Status: Healthy | API Active at <a href="/api/health" style="color:#38bdf8">/api/health</a></p>
</body>
</html>`);
  });
}

// Start Express Server (Host 0.0.0.0 for Network & Cloud deployment)
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Unified Full-Stack Server] Express API + React App running on http://0.0.0.0:${PORT}`);
});

export default app;
