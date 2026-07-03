import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { ProtectedRoute } from './ProtectedRoute';
import type { TaskStatus, TaskPriority } from '../types/task';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  XCircle, 
  Trash2, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus,
  Zap,
  Calendar
} from 'lucide-react';

export const TaskTableView: React.FC = () => {
  const { 
    tasks, 
    setSelectedTaskId, 
    retryTask, 
    cancelTask, 
    deleteTask, 
    clearCompleted, 
    setIsCreateModalOpen,
    triggerBatchSimulate 
  } = useTaskContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Multi-filter matching
  const filteredTasks = tasks.filter(task => {
    // Search query matching (title, id, input prompt, model)
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.input.prompt && task.input.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.model.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && (task.status === 'processing' || task.status === 'queued' || task.status === 'retrying' || task.status === 'pending')) ||
      task.status === statusFilter;

    // Priority filter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    // Type filter
    const matchesType = typeFilter === 'all' || task.type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Success</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center space-x-1.5 w-fit">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>Running</span>
          </span>
        );
      case 'queued':
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1 w-fit">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending</span>
          </span>
        );
      case 'retrying':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center space-x-1 w-fit">
            <RotateCcw className="w-3 h-3 animate-spin text-amber-400" />
            <span>Retrying</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1 w-fit">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Failed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900 text-slate-500 border border-slate-800 flex items-center space-x-1 w-fit">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">MEDIUM</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">LOW</span>;
    }
  };

  const formatCreatedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      if (diffMins < 1) return `Just now (${timeStr})`;
      if (diffMins < 60) return `${diffMins}m ago (${timeStr})`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago (${timeStr})`;
      return `${date.toLocaleDateString()} ${timeStr}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <ProtectedRoute
      fallbackTitle="Task Dashboard Locked"
      fallbackDescription="Sign in to view your task queue, create new jobs, inspect live terminal logs, and manage cluster operations."
    >
      <div className="space-y-4">
        
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4.5 rounded-2xl border border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Task Dashboard</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                /tasks
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              List of current user's asynchronous tasks with status badges, creation timestamps, and live operations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => triggerBatchSimulate(3)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Batch</span>
            </button>
            <button
              onClick={clearCompleted}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
            >
              Clear Finished
            </button>
            
            {/* Prominent "New task" Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Status Tabs */}
            <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
              {[
                { id: 'all', label: 'All Tasks', count: tasks.length },
                { id: 'active', label: 'Active Queue', count: tasks.filter(t => t.status === 'processing' || t.status === 'queued' || t.status === 'retrying').length },
                { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
                { id: 'failed', label: 'Failed', count: tasks.filter(t => t.status === 'failed').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                    statusFilter === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by task ID, title, model, prompt..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

          </div>

          {/* Secondary Filter Dropdowns */}
          <div className="flex items-center space-x-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filters:</span>
            </span>

            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Task Type Select */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Task Types</option>
              <option value="summarization">Summarization</option>
              <option value="code_audit">Code Audit</option>
              <option value="image_gen">Image Generation</option>
              <option value="entity_extraction">Entity Extraction</option>
              <option value="translation">Translation</option>
              <option value="custom_prompt">Custom Prompt</option>
            </select>

            <span className="ml-auto text-slate-500 font-mono">
              {filteredTasks.length} tasks listed
            </span>
          </div>
        </div>

        {/* Main Task Data Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-4">Task Details</th>
                  <th className="py-3.5 px-4">Status Badge</th>
                  <th className="py-3.5 px-4">Created Time</th>
                  <th className="py-3.5 px-4">Model & Priority</th>
                  <th className="py-3.5 px-4">Worker</th>
                  <th className="py-3.5 px-4 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 space-y-2">
                      <p>No tasks found matching your filter criteria.</p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium text-xs hover:bg-cyan-500/30 transition-all"
                      >
                        + Create New Task
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      {/* Task Details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-cyan-400 font-semibold text-[11px]">{task.id}</span>
                          <h4 className="text-white font-medium truncate max-w-xs group-hover:text-cyan-300 transition-colors">
                            {task.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {task.input.prompt || task.input.content}
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="space-y-1">
                          {getStatusBadge(task.status)}
                          {task.status === 'processing' && (
                            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Created Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{formatCreatedTime(task.createdAt)}</span>
                        </div>
                      </td>

                      {/* Model & Priority */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-300 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {task.model}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>
                      </td>

                      {/* Worker */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {task.workerId ? (
                          <span className="text-cyan-300 font-medium">{task.workerId}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Operations / Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          
                          {/* Inspect Operation */}
                          <button
                            onClick={() => setSelectedTaskId(task.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 text-[11px] font-medium flex items-center space-x-1 transition-all"
                            title="Inspect Output & Logs"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Inspect</span>
                          </button>

                          {/* Retry Operation if failed */}
                          {(task.status === 'failed' || task.status === 'cancelled') && (
                            <button
                              onClick={() => retryTask(task.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-[11px] font-medium flex items-center space-x-1 transition-all"
                              title="Retry Execution"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Retry</span>
                            </button>
                          )}

                          {/* Cancel Operation if processing */}
                          {(task.status === 'processing' || task.status === 'queued') && (
                            <button
                              onClick={() => cancelTask(task.id)}
                              className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[11px] font-medium flex items-center space-x-1 transition-all"
                              title="Cancel Execution"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}

                          {/* Delete Operation */}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                            title="Delete Task Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
};
