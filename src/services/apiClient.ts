import type { Task, TaskType, TaskPriority, TaskModel, WorkerNode } from '../types/task';
import { INITIAL_TASKS } from './mockTasksData';
import { taskRunner } from './taskRunner';

// In-memory data store for simulated REST API endpoints
let memoryTasksStore: Task[] = (() => {
  try {
    const saved = localStorage.getItem('ai_task_platform_tasks_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return INITIAL_TASKS;
})();

function persistStore() {
  try {
    localStorage.setItem('ai_task_platform_tasks_v1', JSON.stringify(memoryTasksStore));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }
}

/**
 * TanStack API Client - Simulated Asynchronous REST Endpoints
 */
export const apiClient = {
  // GET /api/v1/tasks
  async getTasks(): Promise<Task[]> {
    // Run background tick for queue progression
    taskRunner.processQueue(memoryTasksStore, (taskId, updater) => {
      memoryTasksStore = memoryTasksStore.map(t => (t.id === taskId ? updater(t) : t));
      persistStore();
    });

    return [...memoryTasksStore];
  },

  // GET /api/v1/tasks/:id
  async getTaskById(taskId: string): Promise<Task | null> {
    const found = memoryTasksStore.find(t => t.id === taskId);
    return found ? { ...found } : null;
  },

  // POST /api/v1/tasks
  async createTask(data: {
    title: string;
    type: TaskType;
    priority: TaskPriority;
    model: TaskModel;
    input: { prompt?: string; content?: string; targetLanguage?: string };
    maxRetries?: number;
    timeoutSeconds?: number;
    webhookUrl?: string;
  }): Promise<Task> {
    const randomId = `TASK-${Math.floor(1000 + Math.random() * 9000)}-AI`;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds()}`;

    const defaultSteps = [
      { id: 's1', name: 'Queue Ingestion & Security Validation', status: 'pending' as const },
      { id: 's2', name: 'Worker Context & Token Pre-allocation', status: 'pending' as const },
      { id: 's3', name: `Model Inference (${data.model})`, status: 'pending' as const },
      { id: 's4', name: 'Output Verification & JSON Serialization', status: 'pending' as const },
    ];

    const newTask: Task = {
      id: randomId,
      title: data.title || `${data.type.toUpperCase()} Job`,
      type: data.type,
      status: 'queued',
      priority: data.priority,
      model: data.model,
      input: data.input,
      progress: 0,
      currentStep: 'Enqueued',
      steps: defaultSteps,
      logs: [
        {
          id: `log-init-${Date.now()}`,
          timestamp: timeStr,
          level: 'info',
          message: `Task ${randomId} enqueued via TanStack Query mutation. Priority: ${data.priority.toUpperCase()}`,
        },
      ],
      retryCount: 0,
      maxRetries: data.maxRetries ?? 3,
      timeoutSeconds: data.timeoutSeconds ?? 30,
      webhookUrl: data.webhookUrl,
      createdAt: now.toISOString(),
    };

    memoryTasksStore = [newTask, ...memoryTasksStore];
    persistStore();
    return newTask;
  },

  // POST /api/v1/tasks/:id/retry
  async retryTask(taskId: string): Promise<Task | null> {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds()}`;

    let updated: Task | null = null;
    memoryTasksStore = memoryTasksStore.map(t => {
      if (t.id !== taskId) return t;
      updated = {
        ...t,
        status: 'retrying',
        progress: 0,
        errorMessage: undefined,
        currentStep: 'Re-enqueued for Retry',
        steps: t.steps.map(s => ({ ...s, status: 'pending' as const, error: undefined })),
        logs: [
          ...t.logs,
          {
            id: `log-retry-${Date.now()}`,
            timestamp: timeStr,
            level: 'warn',
            message: `Manual retry requested via TanStack Query. Resetting execution state.`,
          },
        ],
      };
      return updated;
    });

    persistStore();
    return updated;
  },

  // POST /api/v1/tasks/:id/cancel
  async cancelTask(taskId: string): Promise<Task | null> {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds()}`;

    let updated: Task | null = null;
    memoryTasksStore = memoryTasksStore.map(t => {
      if (t.id !== taskId) return t;
      updated = {
        ...t,
        status: 'cancelled',
        currentStep: 'Cancelled',
        logs: [
          ...t.logs,
          {
            id: `log-cancel-${Date.now()}`,
            timestamp: timeStr,
            level: 'warn',
            message: `Task cancelled by user command.`,
          },
        ],
      };
      return updated;
    });

    persistStore();
    return updated;
  },

  // DELETE /api/v1/tasks/:id
  async deleteTask(taskId: string): Promise<boolean> {
    memoryTasksStore = memoryTasksStore.filter(t => t.id !== taskId);
    persistStore();
    return true;
  },

  // DELETE /api/v1/tasks/completed
  async clearCompleted(): Promise<boolean> {
    memoryTasksStore = memoryTasksStore.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    persistStore();
    return true;
  },

  // GET /api/v1/workers
  async getWorkers(): Promise<WorkerNode[]> {
    return taskRunner.getWorkers();
  },

  // Reset memory store to defaults
  async resetStore(): Promise<Task[]> {
    localStorage.removeItem('ai_task_platform_tasks_v1');
    memoryTasksStore = INITIAL_TASKS;
    return memoryTasksStore;
  }
};
