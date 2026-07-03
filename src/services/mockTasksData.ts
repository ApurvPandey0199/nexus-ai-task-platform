import type { Task } from '../types/task';

export const INITIAL_TASKS: Task[] = [
  {
    id: 'TASK-9041-LLM',
    title: 'Summarize Quarterly AI Infrastructure Report',
    type: 'summarization',
    status: 'completed',
    priority: 'high',
    model: 'claude-3-5-sonnet',
    progress: 100,
    currentStep: 'Finished',
    retryCount: 0,
    maxRetries: 3,
    timeoutSeconds: 30,
    workerId: 'Worker-01',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 17.8).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
    input: {
      prompt: 'Summarize key GPU cluster utilization trends, inference latencies, and auto-scaling cost projections for Q2 2026.',
      content: 'Detailed report containing GPU metrics, memory bandwidth usage, and node allocation logs.',
    },
    output: {
      resultText: `### Executive Summary & Key Takeaways\n\n**Overview:** Q2 2026 AI infrastructure utilization increased by **42%** YoY, driven by real-time streaming inference pipelines.\n\n#### Key Findings:\n1. **GPU Efficiency:** H100 cluster allocation efficiency reached **91.4%** with dynamic batching enabled.\n2. **Latency Reduction:** P99 request latency dropped from 420ms to **180ms** via spec decoding.\n3. **Cost Savings:** Reserved instance migrations saved **$14,200/month** in cloud compute spending.`,
      jsonResult: {
        sentiment: 'Positive',
        keyTopics: ['GPU Utilization', 'Latency Optimization', 'Cloud Savings'],
        costSavings: '$14,200',
      },
      metrics: {
        tokenUsage: 620,
        promptTokens: 410,
        completionTokens: 210,
        costEstimate: 0.0024,
        latencyMs: 1850,
      },
    },
    steps: [
      { id: 'step-1', name: 'Request Validation & Sanitization', status: 'completed', durationMs: 120 },
      { id: 'step-2', name: 'Token Context Buffer Allocation', status: 'completed', durationMs: 230 },
      { id: 'step-3', name: 'Model Inference (Claude 3.5 Sonnet)', status: 'completed', durationMs: 1100 },
      { id: 'step-4', name: 'Post-processing & Markdown Formatting', status: 'completed', durationMs: 400 },
    ],
    logs: [
      { id: 'log-1', timestamp: '17:00:01.012', level: 'info', message: 'Received task payload. Queued for execution.' },
      { id: 'log-2', timestamp: '17:00:01.132', level: 'info', message: 'Worker Worker-01 assigned to task.' },
      { id: 'log-3', timestamp: '17:00:01.362', level: 'debug', message: 'Tokenizing input context: 410 tokens parsed.' },
      { id: 'log-4', timestamp: '17:00:02.462', level: 'info', message: 'Model stream completed successfully.' },
      { id: 'log-5', timestamp: '17:00:02.862', level: 'info', message: 'Task marked as COMPLETED. Output persisted.' },
    ],
  },
  {
    id: 'TASK-9042-CODE',
    title: 'Audit & Refactor Distributed Queue Consumer',
    type: 'code_audit',
    status: 'completed',
    priority: 'critical',
    model: 'gpt-4o',
    progress: 100,
    currentStep: 'Finished',
    retryCount: 0,
    maxRetries: 3,
    timeoutSeconds: 60,
    workerId: 'Worker-02',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 11.9).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 11.1).toISOString(),
    input: {
      prompt: 'Review Node.js Redis stream consumer for memory leaks, unhandled rejections, and lock contention.',
    },
    output: {
      resultText: `### Code Audit & Vulnerability Assessment Report\n\n**Model Assessor:** \`gpt-4o\` | **Audit Score:** 96/100 (Pass)\n\n#### Summary of Changes:\n- Replaced blocking \`XREAD\` loops with async generators to prevent thread blocking.\n- Implemented auto-renewal for distributed locks during long LLM tasks.`,
      codeSnippet: `// Refactored Distributed Queue Consumer
import Redis from 'ioredis';

export async function processQueueStream(redis: Redis, streamKey: string) {
  while (true) {
    try {
      const results = await redis.xreadgroup('GROUP', 'workers', 'worker-1', 'BLOCK', 2000, 'COUNT', 10, 'STREAMS', streamKey, '>');
      if (!results) continue;

      for (const [stream, messages] of results) {
        for (const [id, fields] of messages) {
          await executeTaskWithRetry(id, fields);
          await redis.xack(streamKey, 'workers', id);
        }
      }
    } catch (err) {
      console.error('[QueueConsumer] Error reading stream:', err);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}`,
      language: 'typescript',
      metrics: {
        tokenUsage: 940,
        promptTokens: 520,
        completionTokens: 420,
        costEstimate: 0.0038,
        latencyMs: 2100,
      },
    },
    steps: [
      { id: 'step-1', name: 'AST Syntax Tree Generation', status: 'completed', durationMs: 180 },
      { id: 'step-2', name: 'Static Code Analysis & Pattern Matching', status: 'completed', durationMs: 420 },
      { id: 'step-3', name: 'LLM Refactoring Inference (GPT-4o)', status: 'completed', durationMs: 1200 },
      { id: 'step-4', name: 'Linter & Type Verification', status: 'completed', durationMs: 300 },
    ],
    logs: [
      { id: 'log-1', timestamp: '17:06:01.000', level: 'info', message: 'Task submitted with CRITICAL priority.' },
      { id: 'log-2', timestamp: '17:06:01.050', level: 'info', message: 'Assigned to Worker-02 high-priority pool.' },
      { id: 'log-3', timestamp: '17:06:02.250', level: 'info', message: 'Refactored code passed typescript validation.' },
      { id: 'log-4', timestamp: '17:06:02.550', level: 'info', message: 'Execution finished without warnings.' },
    ],
  },
  {
    id: 'TASK-9043-IMG',
    title: 'Generate Cyberpunk AI Worker Avatar',
    type: 'image_gen',
    status: 'completed',
    priority: 'medium',
    model: 'sdxl-turbo',
    progress: 100,
    currentStep: 'Finished',
    retryCount: 0,
    maxRetries: 2,
    timeoutSeconds: 45,
    workerId: 'Worker-03',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 7.9).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    input: {
      prompt: 'A futuristic cybernetic AI node processing holographic data streams in a glowing dark server room, 8k resolution, photorealistic.',
    },
    output: {
      resultText: 'Rendered 1024x1024 ultra-hd image asset in 2.9s using SDXL-Turbo.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      jsonResult: {
        dimensions: '1024x1024',
        steps: 30,
        seed: 49204812,
      },
      metrics: {
        tokenUsage: 140,
        promptTokens: 140,
        completionTokens: 0,
        costEstimate: 0.012,
        latencyMs: 2900,
      },
    },
    steps: [
      { id: 'step-1', name: 'Prompt Conditioning & CLIP Encoding', status: 'completed', durationMs: 310 },
      { id: 'step-2', name: 'Latent Denoising Diffusion (30 steps)', status: 'completed', durationMs: 2200 },
      { id: 'step-3', name: 'VAE Image Decoding & Compression', status: 'completed', durationMs: 390 },
    ],
    logs: [
      { id: 'log-1', timestamp: '17:10:00.100', level: 'info', message: 'Image diffusion pipeline initialized.' },
      { id: 'log-2', timestamp: '17:10:02.300', level: 'debug', message: 'Denoising step 30/30 complete.' },
      { id: 'log-3', timestamp: '17:10:02.690', level: 'info', message: 'PNG Asset saved to artifact store.' },
    ],
  },
  {
    id: 'TASK-9044-OCR',
    title: 'Extract Medical Invoice Entities & Totals',
    type: 'entity_extraction',
    status: 'processing',
    priority: 'high',
    model: 'gemini-1.5-pro',
    progress: 65,
    currentStep: 'Named Entity Recognition',
    retryCount: 0,
    maxRetries: 3,
    timeoutSeconds: 30,
    workerId: 'Worker-01',
    createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 25).toISOString(),
    input: {
      prompt: 'Extract Patient Name, Clinic ID, Date of Consultation, Total Amount, and Billing Line Items from scan text.',
      content: 'OrthoNow Greater Noida - Consultation for Knee Arthroscopy. Patient: Rahul Sharma. Date: 03-07-2026. Total Fee: ₹18,500.',
    },
    steps: [
      { id: 'step-1', name: 'Text Pre-processing & Tokenization', status: 'completed', durationMs: 180 },
      { id: 'step-2', name: 'Named Entity Recognition', status: 'in_progress' },
      { id: 'step-3', name: 'Structured JSON Mapping & Validation', status: 'pending' },
    ],
    logs: [
      { id: 'log-1', timestamp: '17:17:30.000', level: 'info', message: 'Task picked up by Worker-01.' },
      { id: 'log-2', timestamp: '17:17:30.180', level: 'debug', message: 'Extracted 120 raw tokens from OCR payload.' },
      { id: 'log-3', timestamp: '17:17:32.000', level: 'info', message: 'NER model analyzing entity candidate boundaries...' },
    ],
  },
  {
    id: 'TASK-9045-FAIL',
    title: 'Batch Translation of Clinical Practice Guidelines',
    type: 'translation',
    status: 'failed',
    priority: 'low',
    model: 'llama-3-70b',
    progress: 40,
    currentStep: 'Model Inference',
    retryCount: 3,
    maxRetries: 3,
    timeoutSeconds: 15,
    workerId: 'Worker-03',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 2.8).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 2.2).toISOString(),
    errorMessage: 'Task timed out after 15s during model inference. Max retries (3/3) exhausted.',
    input: {
      prompt: 'Translate 40-page orthopedic procedure documentation from English into German and French.',
      targetLanguage: 'German',
    },
    steps: [
      { id: 'step-1', name: 'Document Chunking', status: 'completed', durationMs: 200 },
      { id: 'step-2', name: 'Model Inference', status: 'failed', error: 'Gateway Timeout (504)' },
      { id: 'step-3', name: 'Translation Alignment', status: 'pending' },
    ],
    logs: [
      { id: 'log-1', timestamp: '17:14:00.000', level: 'info', message: 'Task started. Target language: German.' },
      { id: 'log-2', timestamp: '17:14:15.000', level: 'error', message: 'HTTP 504 Gateway Timeout: Model endpoint unresponsive.' },
      { id: 'log-3', timestamp: '17:14:16.000', level: 'warn', message: 'Attempt 1 failed. Triggering exponential backoff retry...' },
      { id: 'log-4', timestamp: '17:14:31.000', level: 'warn', message: 'Attempt 3 failed. Reached maximum retry limit (3).' },
      { id: 'log-5', timestamp: '17:14:32.000', level: 'error', message: 'Task marked as FAILED. Dead-letter queue notification dispatched.' },
    ],
  },
  {
    id: 'TASK-9046-QUE',
    title: 'Generate Synthetic Patient Intake Dataset',
    type: 'custom_prompt',
    status: 'queued',
    priority: 'medium',
    model: 'gpt-4o',
    progress: 0,
    retryCount: 0,
    maxRetries: 3,
    timeoutSeconds: 45,
    createdAt: new Date(Date.now() - 1000 * 15).toISOString(),
    input: {
      prompt: 'Generate 10 synthetic patient consultation records in JSON format including age, chief complaint, triage priority, and recommended specialty.',
    },
    steps: [
      { id: 'step-1', name: 'Queue Ingestion & Validation', status: 'pending' },
      { id: 'step-2', name: 'Schema Enforcement', status: 'pending' },
      { id: 'step-3', name: 'Model Generation', status: 'pending' },
    ],
    logs: [
      { id: 'log-1', timestamp: '17:17:45.000', level: 'info', message: 'Enqueued task. Waiting for available worker node.' },
    ],
  },
];
