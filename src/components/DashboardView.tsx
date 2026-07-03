import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Cpu, 
  Zap, 
  Layers, 
  RotateCcw, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  ArrowRight
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    tasks, 
    workers, 
    settings, 
    setActiveTab, 
    setSelectedTaskId, 
    setIsCreateModalOpen, 
    setIsWorkerModalOpen,
    triggerBatchSimulate,
    retryTask,
    clearCompleted
  } = useTaskContext();

  // Metric computations
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const processingCount = tasks.filter(t => t.status === 'processing').length;
  const queuedCount = tasks.filter(t => t.status === 'queued' || t.status === 'pending').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;
  const retryingCount = tasks.filter(t => t.status === 'retrying').length;

  const successRate = totalCount > 0 ? Math.round((completedCount / (completedCount + failedCount || 1)) * 100) : 100;

  // Latency computation
  const completedTasksWithLatency = tasks.filter(t => t.status === 'completed' && t.output?.metrics?.latencyMs);
  const avgLatency = completedTasksWithLatency.length > 0
    ? Math.round(completedTasksWithLatency.reduce((acc, t) => acc + (t.output?.metrics?.latencyMs || 0), 0) / completedTasksWithLatency.length)
    : 1450;

  // Total tokens & cost
  const totalTokens = tasks.reduce((acc, t) => acc + (t.output?.metrics?.tokenUsage || 0), 0);
  const totalCost = tasks.reduce((acc, t) => acc + (t.output?.metrics?.costEstimate || 0), 0).toFixed(4);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Quick System Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Live Cluster Orchestrator</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">AI Task Processing Control Center</h2>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              Distributed asynchronous task queue powering LLM inference, vision pipelines, code refactoring, and structured data extraction.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Create AI Task</span>
            </button>
            <button
              onClick={() => triggerBatchSimulate(4)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white text-xs font-medium transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simulate 4 Tasks</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Tasks */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Enqueued</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
            <span className="text-emerald-400 font-medium">100%</span>
            <span>in system memory</span>
          </div>
        </div>

        {/* Processing */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-medium">Processing Now</span>
            <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">{processingCount}</div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            {queuedCount} queued in pipeline
          </div>
        </div>

        {/* Completed */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Success Rate: <span className="text-emerald-400 font-semibold">{successRate}%</span>
          </div>
        </div>

        {/* Failed */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Failed / DLQ</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{failedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {retryingCount > 0 ? `${retryingCount} currently retrying` : '0 pending retry'}
          </div>
        </div>

        {/* Avg Latency */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{avgLatency} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>P95 &lt; 2.2s</span>
          </div>
        </div>

        {/* Cost & Tokens */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Est. Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">${totalCost}</div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {totalTokens.toLocaleString()} tokens
          </div>
        </div>

      </div>

      {/* Main Grid: Active Worker Nodes & Live Task Queue Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Worker Node Pool Visualizer (1 Col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Virtual Worker Pool</h3>
            </div>
            <button
              onClick={() => setIsWorkerModalOpen(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Configure ({settings.concurrency})
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Active parallel threads reading from the distributed task queue with auto-retry backoff.
          </p>

          <div className="space-y-3">
            {workers.slice(0, settings.concurrency).map(worker => (
              <div
                key={worker.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  worker.status === 'busy'
                    ? 'bg-cyan-950/20 border-cyan-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${worker.status === 'busy' ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`}></span>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{worker.name}</h4>
                      <p className="text-[10px] text-slate-400">ID: {worker.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    worker.status === 'busy' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {worker.status}
                  </span>
                </div>

                {worker.currentTaskId && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Task:</span>
                    <span className="font-mono text-cyan-300 font-medium">{worker.currentTaskId}</span>
                  </div>
                )}

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/50 flex justify-between">
                    <span>Processed:</span>
                    <span className="text-slate-200 font-medium">{worker.processedCount}</span>
                  </div>
                  <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/50 flex justify-between">
                    <span>Errors:</span>
                    <span className={worker.errorCount > 0 ? 'text-rose-400 font-medium' : 'text-slate-200 font-medium'}>
                      {worker.errorCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Simulation Speed: <strong className="text-cyan-300">{settings.speedMultiplier}x</strong></span>
            <span>Failure Simulation: <strong className={settings.failureRate > 0 ? 'text-rose-400' : 'text-slate-300'}>{(settings.failureRate * 100).toFixed(0)}%</strong></span>
          </div>
        </div>

        {/* Right Column: Live Task Queue & Recent Execution Feed (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Live Execution Queue</h3>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
              >
                <span>View All ({tasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Task List Preview (Top 5 active or recent) */}
            <div className="space-y-3">
              {tasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        task.status === 'completed' ? 'bg-emerald-400' :
                        task.status === 'processing' ? 'bg-cyan-400 animate-ping' :
                        task.status === 'failed' ? 'bg-rose-500' :
                        task.status === 'retrying' ? 'bg-amber-400 animate-bounce' : 'bg-slate-500'
                      }`}></span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {task.title}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-400">{task.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                          {task.input.prompt || task.input.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="font-mono text-slate-300 px-2 py-0.5 rounded bg-slate-800 text-[10px]">
                        {task.model}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        task.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        task.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar for Processing tasks */}
                  {task.status === 'processing' && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Step: <strong className="text-cyan-300">{task.currentStep}</strong></span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Failure banner if failed */}
                  {task.status === 'failed' && (
                    <div className="mt-2.5 p-2 rounded bg-rose-950/30 border border-rose-500/20 text-[11px] text-rose-300 flex items-center justify-between">
                      <span className="truncate">{task.errorMessage}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          retryTask(task.id);
                        }}
                        className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[10px] font-semibold flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Showing 5 of {tasks.length} tasks</span>
            <div className="flex space-x-2">
              <button
                onClick={clearCompleted}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              >
                Clear Finished
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all font-medium"
              >
                Open Full Task Manager
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
