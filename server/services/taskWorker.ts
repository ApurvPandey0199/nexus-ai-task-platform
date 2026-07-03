import { TaskRepository, TaskLogRepository } from '../db/repository';
import type { TaskOutput } from '../../src/types/task';
import { generateMockAiOutput } from '../../src/services/aiGenerator';

/**
 * Server Function: runTask(taskId)
 * Acts as the background worker daemon for async task processing.
 *
 * Contract followed:
 * 1. Sets status = 'running', writes a "started" log to task_logs.
 * 2. Executes the operation (uppercase / lowercase / reverse / word count / summarization / code_audit).
 * 3. Writes result + "finished" log, sets status = 'success' (or 'failed' with error log).
 */
export async function runTask(taskId: string): Promise<void> {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();

  // Fetch task from database
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    console.error(`[runTask Worker] Task ${taskId} not found in database.`);
    return;
  }

  console.log(`[runTask Worker] Starting background execution for Task ${taskId} (Operation: ${task.type})`);

  try {
    // Step 1: Set status = 'running' & write "started" log
    await TaskRepository.update(taskId, {
      status: 'processing', // 'running' in DB schema mapping
      startedAt: now.toISOString(),
      progress: 25,
      currentStep: `Executing ${task.type.toUpperCase()} operation`,
      logs: [
        {
          id: `log-start-${Date.now()}`,
          timestamp: timeStr,
          level: 'info',
          message: `[runTask Worker] Status transition: PENDING → RUNNING. Started execution of ${task.type.toUpperCase()}.`,
        },
      ],
    });

    await TaskLogRepository.addLog(
      taskId,
      'info',
      `[runTask Worker] Status transition: PENDING → RUNNING. Started execution of ${task.type.toUpperCase()}.`
    );

    // Simulate realistic async processing latency (600ms)
    await new Promise(r => setTimeout(r, 600));

    // Step 2: Execute operation (uppercase / lowercase / reverse / word count)
    const promptText = task.input.prompt || task.input.content || '';
    let resultOutput: TaskOutput;

    switch (task.type) {
      case 'uppercase': {
        const converted = promptText.toUpperCase();
        resultOutput = {
          resultText: `### Uppercase Operation Output\n\n**Original Text:** "${promptText}"\n\n**Converted Output:**\n\`\`\`\n${converted}\n\`\`\``,
          jsonResult: { original: promptText, converted, operation: 'UPPERCASE' },
          metrics: { tokenUsage: 85, promptTokens: 45, completionTokens: 40, costEstimate: 0.0002, latencyMs: 650 },
        };
        break;
      }

      case 'lowercase': {
        const converted = promptText.toLowerCase();
        resultOutput = {
          resultText: `### Lowercase Operation Output\n\n**Original Text:** "${promptText}"\n\n**Converted Output:**\n\`\`\`\n${converted}\n\`\`\``,
          jsonResult: { original: promptText, converted, operation: 'LOWERCASE' },
          metrics: { tokenUsage: 85, promptTokens: 45, completionTokens: 40, costEstimate: 0.0002, latencyMs: 650 },
        };
        break;
      }

      case 'reverse': {
        const reversed = promptText.split('').reverse().join('');
        resultOutput = {
          resultText: `### Reverse Operation Output\n\n**Original Text:** "${promptText}"\n\n**Reversed Output:**\n\`\`\`\n${reversed}\n\`\`\``,
          jsonResult: { original: promptText, reversed, operation: 'REVERSE' },
          metrics: { tokenUsage: 90, promptTokens: 50, completionTokens: 40, costEstimate: 0.0002, latencyMs: 700 },
        };
        break;
      }

      case 'word_count': {
        const words = promptText.trim() ? promptText.trim().split(/\s+/).length : 0;
        const chars = promptText.length;
        const sentences = promptText.split(/[.!?]+/).filter(Boolean).length;
        resultOutput = {
          resultText: `### Word Count Analytics Report\n\n**Analyzed Context:** "${promptText.slice(0, 60)}..."\n\n- 📝 **Word Count:** ${words} words\n- 🔤 **Character Count:** ${chars} characters\n- 📄 **Sentence Count:** ${sentences} sentences\n- ⏱️ **Est. Reading Time:** ${(words / 200).toFixed(2)} min`,
          jsonResult: { words, chars, sentences, readingTimeMinutes: (words / 200).toFixed(2) },
          metrics: { tokenUsage: 110, promptTokens: 60, completionTokens: 50, costEstimate: 0.0003, latencyMs: 750 },
        };
        break;
      }

      default: {
        // Fallback for LLM summarization / code audit
        resultOutput = generateMockAiOutput(task.type, task.model, task.input);
        break;
      }
    }

    // Step 3: Write result + "finished" log & set status = 'success'
    const finishedTime = new Date();
    await TaskRepository.update(taskId, {
      status: 'completed', // 'success' in schema mapping
      progress: 100,
      currentStep: 'Finished',
      output: resultOutput,
      completedAt: finishedTime.toISOString(),
      logs: [
        ...task.logs,
        {
          id: `log-end-${Date.now()}`,
          timestamp: finishedTime.toLocaleTimeString(),
          level: 'info',
          message: `[runTask Worker] Status transition: RUNNING → SUCCESS. Execution finished in ${resultOutput.metrics?.latencyMs || 650}ms. Result persisted.`,
        },
      ],
    });

    await TaskLogRepository.addLog(
      taskId,
      'info',
      `[runTask Worker] Status transition: RUNNING → SUCCESS. Execution finished in ${resultOutput.metrics?.latencyMs || 650}ms. Result persisted.`
    );

    console.log(`[runTask Worker] Task ${taskId} successfully completed.`);
  } catch (err: any) {
    const errorMsg = err.message || 'Worker execution error';
    console.error(`[runTask Worker] Task ${taskId} failed:`, errorMsg);

    // Set status = 'failed' with error log
    await TaskRepository.update(taskId, {
      status: 'failed',
      progress: 50,
      currentStep: 'Execution Failed',
      errorMessage: errorMsg,
      logs: [
        ...task.logs,
        {
          id: `log-err-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: `[runTask Worker] Status transition: RUNNING → FAILED. Error: ${errorMsg}`,
        },
      ],
    });

    await TaskLogRepository.addLog(
      taskId,
      'error',
      `[runTask Worker] Status transition: RUNNING → FAILED. Error: ${errorMsg}`
    );
  }
}
