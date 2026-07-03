import type { Task, WorkerNode, WorkerSettings } from '../types/task';
import { generateMockAiOutput } from './aiGenerator';

export class TaskRunner {
  private workers: WorkerNode[] = [
    { id: 'Worker-01', name: 'Alpha Worker (GPU-1)', status: 'idle', processedCount: 14, errorCount: 0, cpuUsage: 12, memoryUsage: 34 },
    { id: 'Worker-02', name: 'Beta Worker (GPU-2)', status: 'idle', processedCount: 22, errorCount: 1, cpuUsage: 18, memoryUsage: 48 },
    { id: 'Worker-03', name: 'Gamma Worker (CPU Pool)', status: 'idle', processedCount: 9, errorCount: 2, cpuUsage: 8, memoryUsage: 22 },
  ];

  private settings: WorkerSettings = {
    concurrency: 3,
    speedMultiplier: 1,
    failureRate: 0,
    isPaused: false,
  };

  private activeProcessingIds = new Set<string>();

  public getWorkers(): WorkerNode[] {
    return [...this.workers];
  }

  public getSettings(): WorkerSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<WorkerSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Main Queue Tick: Checks for queued tasks and assigns available workers
   */
  public processQueue(
    tasks: Task[],
    updateTaskState: (taskId: string, updater: (t: Task) => Task) => void
  ) {
    if (this.settings.isPaused) return;

    // Filter available workers up to concurrency
    const activeWorkers = this.workers.slice(0, this.settings.concurrency);

    // Find pending/queued tasks sorted by priority (critical > high > medium > low)
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    
    const runnableTasks = tasks
      .filter(t => (t.status === 'queued' || t.status === 'pending' || t.status === 'retrying') && !this.activeProcessingIds.has(t.id))
      .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    for (const task of runnableTasks) {
      // Find an idle worker
      const idleWorker = activeWorkers.find(w => w.status === 'idle');
      if (!idleWorker) break;

      // Assign task to worker
      this.activeProcessingIds.add(task.id);
      idleWorker.status = 'busy';
      idleWorker.currentTaskId = task.id;

      this.executeSingleTask(task, idleWorker, updateTaskState);
    }
  }

  /**
   * Simulates step-by-step processing of a task with progress & logs
   */
  private async executeSingleTask(
    task: Task,
    worker: WorkerNode,
    updateTaskState: (taskId: string, updater: (t: Task) => Task) => void
  ) {
    const speed = this.settings.speedMultiplier || 1;

    // 1. Mark task as processing
    updateTaskState(task.id, current => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds()}`;
      return {
        ...current,
        status: 'processing',
        workerId: worker.id,
        startedAt: now.toISOString(),
        progress: 10,
        currentStep: current.steps[0]?.name || 'Initializing',
        steps: current.steps.map((s, idx) => idx === 0 ? { ...s, status: 'in_progress' } : s),
        logs: [
          ...current.logs,
          {
            id: `log-${Date.now()}`,
            timestamp: timeStr,
            level: 'info',
            message: `Task assigned to ${worker.name} (${worker.id}). Starting processing pipeline...`,
            step: 'Initialization',
          },
        ],
      };
    });

    // Determine if we should simulate a failure for testing retries
    const shouldFail = Math.random() < this.settings.failureRate;

    // Simulation steps: 4 execution ticks
    const totalSteps = 4;
    const baseStepDuration = 1000 / speed;

    for (let stepIdx = 1; stepIdx <= totalSteps; stepIdx++) {
      await new Promise(r => setTimeout(r, baseStepDuration));

      // Calculate progress percentage (25%, 50%, 75%, 90%)
      const currentProgress = Math.min(90, Math.round((stepIdx / totalSteps) * 90));

      // Check if simulated failure strikes at step 3
      if (shouldFail && stepIdx === 3) {
        worker.errorCount++;
        worker.status = 'idle';
        worker.currentTaskId = undefined;
        this.activeProcessingIds.delete(task.id);

        updateTaskState(task.id, current => {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds()}`;
          const nextRetry = current.retryCount + 1;
          const isMaxExhausted = nextRetry >= current.maxRetries;

          return {
            ...current,
            status: isMaxExhausted ? 'failed' : 'retrying',
            retryCount: nextRetry,
            errorMessage: isMaxExhausted
              ? `Task execution failed after ${nextRetry} attempts: Simulated model endpoint timeout (504).`
              : `Transient error encountered on attempt ${nextRetry}. Retrying...`,
            steps: current.steps.map((s, idx) => idx === stepIdx - 1 ? { ...s, status: 'failed', error: 'Simulated Network Error' } : s),
            logs: [
              ...current.logs,
              {
                id: `log-${Date.now()}`,
                timestamp: timeStr,
                level: 'error',
                message: `[ERROR] Connection reset during inference step. (${nextRetry}/${current.maxRetries} retries)`,
              },
              ...(isMaxExhausted
                ? [{
                    id: `log-${Date.now() + 1}`,
                    timestamp: timeStr,
                    level: 'error' as const,
                    message: 'Max retries exhausted. Task moved to Dead Letter Queue.',
                  }]
                : []),
            ],
          };
        });
        return;
      }

      // Normal progress update
      updateTaskState(task.id, current => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds()}`;
        const activeStepName = current.steps[stepIdx - 1]?.name || `Pipeline Step ${stepIdx}`;
        
        return {
          ...current,
          progress: currentProgress,
          currentStep: activeStepName,
          steps: current.steps.map((s, idx) => {
            if (idx < stepIdx - 1) return { ...s, status: 'completed' };
            if (idx === stepIdx - 1) return { ...s, status: 'in_progress' };
            return s;
          }),
          logs: [
            ...current.logs,
            {
              id: `log-${Date.now()}-${stepIdx}`,
              timestamp: timeStr,
              level: 'debug',
              message: `Executing step: ${activeStepName} [${currentProgress}%]`,
              step: activeStepName,
            },
          ],
        };
      });
    }

    // Final completion step
    await new Promise(r => setTimeout(r, 600 / speed));

    // Generate output
    const output = generateMockAiOutput(task.type, task.model, task.input);

    worker.processedCount++;
    worker.status = 'idle';
    worker.currentTaskId = undefined;
    this.activeProcessingIds.delete(task.id);

    updateTaskState(task.id, current => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds()}`;
      
      return {
        ...current,
        status: 'completed',
        progress: 100,
        currentStep: 'Finished',
        completedAt: now.toISOString(),
        output,
        steps: current.steps.map(s => ({ ...s, status: 'completed' })),
        logs: [
          ...current.logs,
          {
            id: `log-end-${Date.now()}`,
            timestamp: timeStr,
            level: 'info',
            message: `Task completed successfully in ${output.metrics?.latencyMs || 1200}ms. Tokens used: ${output.metrics?.tokenUsage || 450}`,
          },
        ],
      };
    });
  }
}

export const taskRunner = new TaskRunner();
