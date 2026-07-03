import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import type { TaskType, TaskPriority, TaskModel } from '../types/task';
import { 
  X, 
  Sparkles, 
  Send, 
  FileText, 
  Code2, 
  ShieldAlert,
  Type,
  ArrowRightLeft,
  Hash,
  ArrowDownLeft
} from 'lucide-react';

export const CreateTaskModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createTask, setSelectedTaskId } = useTaskContext();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('uppercase');
  const [model, setModel] = useState<TaskModel>('claude-3-5-sonnet');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [prompt, setPrompt] = useState('');
  const [maxRetries, setMaxRetries] = useState(3);
  const [timeoutSeconds] = useState(30);
  const [webhookUrl, setWebhookUrl] = useState('https://api.orthonow.com/webhooks/task-completion');

  if (!isCreateModalOpen) return null;

  // Preset Template loader for Operation Types
  const loadPreset = (presetType: TaskType) => {
    setType(presetType);
    switch (presetType) {
      case 'uppercase':
        setTitle('Convert Patient Name to UPPERCASE');
        setPrompt('rahul sharma - orthopedic patient intake record');
        break;
      case 'lowercase':
        setTitle('Convert Email Address to lowercase');
        setPrompt('ADMIN.SUPPORT@NEXUSAI.IO');
        break;
      case 'reverse':
        setTitle('Reverse Text Payload Sequence');
        setPrompt('OrthoNow Greater Noida Patient Booking System');
        break;
      case 'word_count':
        setTitle('Analyze Text Word & Sentence Count');
        setPrompt('OrthoNow operates 9 specialized clinics across Greater Noida, Bengaluru, Hyderabad, and Chennai. Our mission is to optimize patient SLA latencies.');
        break;
      case 'summarization':
        setTitle('Summarize Orthopedic SLA Monitoring Logs');
        setModel('claude-3-5-sonnet');
        setPrompt('Extract SLA violation frequency, webhook timeout latencies, and Karix WhatsApp delivery rates from system logs.');
        break;
      case 'code_audit':
        setTitle('Refactor Redis Stream Consumer Node');
        setModel('gpt-4o');
        setPriority('critical');
        setPrompt('Review Node.js Redis stream consumer for memory leaks, unhandled rejections, and lock contention during high-burst events.');
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // 1. Insert row with status pending / queued & enqueue async job
    const newTask = createTask({
      title: title || `${type.toUpperCase()} Task`,
      type,
      model,
      priority,
      input: { prompt },
      maxRetries,
      timeoutSeconds,
      webhookUrl,
    });

    // 2. Close modal & redirect to task detail inspector modal
    setIsCreateModalOpen(false);
    setSelectedTaskId(newTask.id);

    // Reset inputs
    setTitle('');
    setPrompt('');
  };

  // Preview JSON payload for developer reference
  const jsonPreview = {
    title: title || `${type.toUpperCase()} Task`,
    operation_type: type,
    initial_status: "pending",
    model_name: model,
    priority,
    parameters: {
      input_text: prompt,
    },
    retry_policy: {
      max_retries: maxRetries,
      timeout_seconds: timeoutSeconds,
    },
    webhook_callback: webhookUrl,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl glass-panel rounded-2xl border border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Task (/tasks/new)</h2>
              <p className="text-xs text-slate-400">Inserts row with status pending, enqueues async job, and redirects to task detail</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 terminal-scroll text-xs">
          
          {/* Operation Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Select Operation:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'uppercase', label: 'Uppercase', icon: Type },
                { id: 'lowercase', label: 'Lowercase', icon: ArrowDownLeft },
                { id: 'reverse', label: 'Reverse', icon: ArrowRightLeft },
                { id: 'word_count', label: 'Word Count', icon: Hash },
                { id: 'summarization', label: 'Summarization', icon: FileText },
                { id: 'code_audit', label: 'Code Refactor', icon: Code2 },
              ].map(p => {
                const Icon = p.icon;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => loadPreset(p.id as TaskType)}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                      type === p.id
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task Title & Operation Type Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Title:</label>
              <input
                type="text"
                placeholder="e.g. Convert Patient Record to Uppercase"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Operation Mode:</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50 uppercase"
              >
                <option value="uppercase">UPPERCASE (Text Conversion)</option>
                <option value="lowercase">LOWERCASE (Text Conversion)</option>
                <option value="reverse">REVERSE (Character Reversal)</option>
                <option value="word_count">WORD COUNT (Analytics)</option>
                <option value="summarization">SUMMARIZATION (AI LLM)</option>
                <option value="code_audit">CODE REFACTOR (AI Code Audit)</option>
              </select>
            </div>
          </div>

          {/* Input Text Area */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Input Text:</label>
            <textarea
              rows={4}
              placeholder="Enter input text payload to process..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono text-xs"
            ></textarea>
          </div>

          {/* Model & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Queue Priority:</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="low">Low (Batch / Background)</option>
                <option value="medium">Medium (Standard SLA)</option>
                <option value="high">High (Accelerated Routing)</option>
                <option value="critical">Critical (Immediate Preemption)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Model Selection:</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value as TaskModel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Default)</option>
                <option value="gpt-4o">GPT-4o (Fast High-Throughput)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Long Context)</option>
                <option value="llama-3-70b">Llama 3 70B (Open Engine)</option>
              </select>
            </div>
          </div>

          {/* Fault-Tolerance & Webhook Config */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Fault-Tolerance & Webhook Config</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Max Retry Count:</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={maxRetries}
                  onChange={e => setMaxRetries(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Webhook Notification Callback:</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Generated API Payload Preview */}
          <div>
            <label className="block text-slate-400 text-[11px] font-mono mb-1">Generated Request Payload (status: "pending"):</label>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-[11px] overflow-x-auto">
              {JSON.stringify(jsonPreview, null, 2)}
            </pre>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
              <span>Submit & Redirect to Detail</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
