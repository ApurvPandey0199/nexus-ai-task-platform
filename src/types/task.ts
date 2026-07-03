export type TaskType = 
  | 'summarization'
  | 'image_gen'
  | 'code_audit'
  | 'entity_extraction'
  | 'translation'
  | 'uppercase'
  | 'lowercase'
  | 'reverse'
  | 'word_count'
  | 'custom_prompt';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export type TaskModel = 
  | 'gpt-4o'
  | 'claude-3-5-sonnet'
  | 'gemini-1.5-pro'
  | 'llama-3-70b'
  | 'sdxl-turbo'
  | 'whisper-v3';

export interface TaskLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  step?: string;
}

export interface TaskStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  durationMs?: number;
  error?: string;
}

export interface TaskOutput {
  resultText?: string;
  codeSnippet?: string;
  language?: string;
  imageUrl?: string;
  jsonResult?: Record<string, any>;
  entities?: Array<{ name: string; type: string; confidence: number }>;
  metrics?: {
    tokenUsage: number;
    promptTokens: number;
    completionTokens: number;
    costEstimate: number;
    latencyMs: number;
  };
}

export interface TaskInput {
  prompt?: string;
  content?: string;
  targetLanguage?: string;
  imageUrl?: string;
  params?: Record<string, any>;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  model: TaskModel;
  input: TaskInput;
  output?: TaskOutput;
  progress: number; // 0 to 100
  currentStep?: string;
  steps: TaskStep[];
  logs: TaskLog[];
  retryCount: number;
  maxRetries: number;
  timeoutSeconds: number;
  workerId?: string;
  webhookUrl?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface WorkerNode {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'offline';
  currentTaskId?: string;
  processedCount: number;
  errorCount: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface WorkerSettings {
  concurrency: number; // Number of parallel workers (1-5)
  speedMultiplier: number; // 1x, 2x, 5x
  failureRate: number; // 0 to 0.5 (for testing retry logic)
  isPaused: boolean;
}
