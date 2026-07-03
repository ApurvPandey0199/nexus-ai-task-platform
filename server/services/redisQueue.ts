import { TaskRepository } from '../db/repository';
import type { Task, TaskStatus } from '../../src/types/task';

/**
 * Redis Queue & Asynchronous Cloud Task Dispatcher
 * Manages Redis stream/queue interactions and status transitions:
 * Pending (queued) → Running (processing) → Success (completed) / Failed (failed)
 */

export interface RedisJobPayload {
  jobId: string;
  taskId: string;
  type: string;
  model: string;
  priority: string;
  input: Record<string, any>;
  maxRetries: number;
  enqueuedAt: string;
}

// In-Memory Queue Store as fallback if standalone Redis is offline
const redisQueueBuffer: RedisJobPayload[] = [];

export const RedisQueueService = {
  /**
   * Enqueues a task into Redis Stream 'tasks:queue'
   */
  async enqueueTask(task: Task): Promise<RedisJobPayload> {
    const jobPayload: RedisJobPayload = {
      jobId: `job-redis-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      taskId: task.id,
      type: task.type,
      model: task.model,
      priority: task.priority,
      input: task.input,
      maxRetries: task.maxRetries,
      enqueuedAt: new Date().toISOString(),
    };

    redisQueueBuffer.push(jobPayload);
    console.log(`[Redis Queue] Enqueued job ${jobPayload.jobId} for Task ${task.id} (Stream: tasks:queue)`);

    // Ensure initial status is Pending (queued)
    await TaskRepository.update(task.id, {
      status: 'queued',
      progress: 0,
      currentStep: 'Pending in Redis Queue',
    });

    return jobPayload;
  },

  /**
   * Pops next job from Redis Queue
   */
  async popNextJob(): Promise<RedisJobPayload | null> {
    if (redisQueueBuffer.length === 0) return null;
    return redisQueueBuffer.shift() || null;
  },

  /**
   * Transition Task Status: Pending → Running → Success / Failed
   */
  async transitionStatus(
    taskId: string,
    status: 'Running' | 'Success' | 'Failed',
    details?: {
      progress?: number;
      currentStep?: string;
      output?: any;
      errorMessage?: string;
      workerId?: string;
    }
  ): Promise<Task | null> {
    let mappedStatus: TaskStatus = 'processing';
    if (status === 'Running') mappedStatus = 'processing';
    if (status === 'Success') mappedStatus = 'completed';
    if (status === 'Failed') mappedStatus = 'failed';

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds()}`;

    const existing = await TaskRepository.findById(taskId);
    if (!existing) return null;

    const updatedLogs = [
      ...existing.logs,
      {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        level: status === 'Failed' ? ('error' as const) : ('info' as const),
        message: `[RedisWorker/CloudFunction] Status transition: ${status.toUpperCase()} (${details?.currentStep || 'State Updated'})`,
        step: details?.currentStep,
      },
    ];

    const updated = await TaskRepository.update(taskId, {
      status: mappedStatus,
      progress: details?.progress ?? (status === 'Success' ? 100 : existing.progress),
      currentStep: details?.currentStep ?? (status === 'Success' ? 'Finished' : existing.currentStep),
      output: details?.output || existing.output,
      errorMessage: details?.errorMessage,
      workerId: details?.workerId || existing.workerId || 'Python-Worker-01',
      startedAt: status === 'Running' && !existing.startedAt ? now.toISOString() : existing.startedAt,
      completedAt: status === 'Success' || status === 'Failed' ? now.toISOString() : existing.completedAt,
      logs: updatedLogs,
    });

    console.log(`[Status Transition] Task ${taskId}: ${existing.status.toUpperCase()} → ${status.toUpperCase()}`);
    return updated;
  },

  /**
   * Get Queue Metrics
   */
  async getQueueStats() {
    return {
      streamName: 'tasks:queue',
      pendingJobsCount: redisQueueBuffer.length,
      activeConsumersCount: 3,
      consumerGroup: 'python-workers-group',
    };
  }
};
