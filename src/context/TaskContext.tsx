import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, TaskType, TaskPriority, TaskModel, WorkerNode, WorkerSettings } from '../types/task';
import { apiClient } from '../services/apiClient';
import { taskRunner } from '../services/taskRunner';

interface TaskContextType {
  tasks: Task[];
  workers: WorkerNode[];
  settings: WorkerSettings;
  activeTab: 'dashboard' | 'tasks' | 'analytics' | 'api';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'analytics' | 'api') => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isWorkerModalOpen: boolean;
  setIsWorkerModalOpen: (open: boolean) => void;
  createTask: (data: {
    title: string;
    type: TaskType;
    priority: TaskPriority;
    model: TaskModel;
    input: { prompt?: string; content?: string; targetLanguage?: string };
    maxRetries?: number;
    timeoutSeconds?: number;
    webhookUrl?: string;
  }) => Task;
  retryTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  clearCompleted: () => void;
  togglePauseQueue: () => void;
  updateWorkerSettings: (settings: Partial<WorkerSettings>) => void;
  triggerBatchSimulate: (count?: number) => void;
  resetToDefault: () => void;
  isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'analytics' | 'api'>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [settings, setSettings] = useState<WorkerSettings>(taskRunner.getSettings());

  // TanStack Query: Poll tasks every 1000ms for real-time queue updates
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.getTasks(),
    refetchInterval: 1000,
  });

  // TanStack Query: Fetch worker nodes
  const { data: workers = taskRunner.getWorkers() } = useQuery({
    queryKey: ['workers'],
    queryFn: () => apiClient.getWorkers(),
    refetchInterval: 1000,
  });

  // TanStack Mutation: Create Task
  const createTaskMutation = useMutation({
    mutationFn: (data: Parameters<TaskContextType['createTask']>[0]) => apiClient.createTask(data),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTaskId(newTask.id);
    },
  });

  // TanStack Mutation: Retry Task
  const retryTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiClient.retryTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // TanStack Mutation: Cancel Task
  const cancelTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiClient.cancelTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // TanStack Mutation: Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiClient.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    },
  });

  // TanStack Mutation: Clear Completed
  const clearCompletedMutation = useMutation({
    mutationFn: () => apiClient.clearCompleted(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Actions
  const createTask = useCallback((data: Parameters<TaskContextType['createTask']>[0]) => {
    createTaskMutation.mutateAsync(data);
    
    // Fallback synchronous generation for instant UX response
    const randomId = `TASK-${Math.floor(1000 + Math.random() * 9000)}-AI`;
    const now = new Date();
    return {
      id: randomId,
      title: data.title || `${data.type.toUpperCase()} Job`,
      type: data.type,
      status: 'queued' as const,
      priority: data.priority,
      model: data.model,
      input: data.input,
      progress: 0,
      currentStep: 'Enqueued',
      steps: [],
      logs: [],
      retryCount: 0,
      maxRetries: data.maxRetries ?? 3,
      timeoutSeconds: data.timeoutSeconds ?? 30,
      createdAt: now.toISOString(),
    };
  }, [createTaskMutation]);

  const retryTask = useCallback((taskId: string) => {
    retryTaskMutation.mutate(taskId);
  }, [retryTaskMutation]);

  const cancelTask = useCallback((taskId: string) => {
    cancelTaskMutation.mutate(taskId);
  }, [cancelTaskMutation]);

  const deleteTask = useCallback((taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  }, [deleteTaskMutation]);

  const clearCompleted = useCallback(() => {
    clearCompletedMutation.mutate();
  }, [clearCompletedMutation]);

  const togglePauseQueue = useCallback(() => {
    const newPaused = !settings.isPaused;
    taskRunner.updateSettings({ isPaused: newPaused });
    setSettings(taskRunner.getSettings());
  }, [settings.isPaused]);

  const updateWorkerSettings = useCallback((newSettings: Partial<WorkerSettings>) => {
    taskRunner.updateSettings(newSettings);
    setSettings(taskRunner.getSettings());
  }, []);

  const triggerBatchSimulate = useCallback((count: number = 3) => {
    const types: TaskType[] = ['summarization', 'code_audit', 'image_gen', 'entity_extraction', 'translation'];
    const models: TaskModel[] = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'llama-3-70b'];
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const model = models[Math.floor(Math.random() * models.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];

      createTaskMutation.mutate({
        title: `Batch Simulated ${type.toUpperCase()} #${i + 1}`,
        type,
        priority,
        model,
        input: { prompt: `Batch evaluation input sample for ${type} using model ${model}` },
      });
    }
  }, [createTaskMutation]);

  const resetToDefault = useCallback(async () => {
    await apiClient.resetStore();
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        workers,
        settings,
        activeTab,
        setActiveTab,
        selectedTaskId,
        setSelectedTaskId,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isWorkerModalOpen,
        setIsWorkerModalOpen,
        createTask,
        retryTask,
        cancelTask,
        deleteTask,
        clearCompleted,
        togglePauseQueue,
        updateWorkerSettings,
        triggerBatchSimulate,
        resetToDefault,
        isLoading,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used within TaskProvider');
  return context;
};
