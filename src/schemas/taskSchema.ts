import { z } from 'zod';

export const TaskOperationEnum = z.enum([
  'uppercase',
  'lowercase',
  'reverse',
  'word_count',
  'summarization',
  'code_audit',
]);

export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(100, 'Title must be 100 characters or less.')
    .trim(),
  type: TaskOperationEnum,
  priority: TaskPriorityEnum.default('medium'),
  model: z.string().default('claude-3-5-sonnet'),
  input: z.object({
    prompt: z.string().min(1, 'Input text cannot be empty.').trim(),
    content: z.string().optional(),
    targetLanguage: z.string().optional(),
  }),
  maxRetries: z.number().min(0).max(5).default(3),
  timeoutSeconds: z.number().min(5).max(300).default(30),
  webhookUrl: z.string().url('Invalid webhook URL format.').optional().or(z.literal('')),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
