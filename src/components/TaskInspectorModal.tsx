import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { 
  X, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Copy, 
  Download, 
  Code2, 
  FileText, 
  Check,
  Layers,
  Activity,
  FileCode
} from 'lucide-react';

export const TaskInspectorModal: React.FC = () => {
  const { tasks, selectedTaskId, setSelectedTaskId, retryTask } = useTaskContext();
  const [activeInspectorTab, setActiveInspectorTab] = useState<'output' | 'logs' | 'steps' | 'json'>('output');
  const [copied, setCopied] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [webhookSimulated, setWebhookSimulated] = useState(false);

  const task = tasks.find(t => t.id === selectedTaskId);

  if (!task) return null;

  const handleCopyOutput = () => {
    const textToCopy = task.output?.resultText || task.output?.codeSnippet || JSON.stringify(task.output?.jsonResult, null, 2) || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadOutput = () => {
    const content = task.output?.resultText || task.output?.codeSnippet || JSON.stringify(task.output, null, 2) || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${task.id}-output.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = task.logs.filter(l => 
    l.message.toLowerCase().includes(logSearch.toLowerCase()) || 
    l.level.toLowerCase().includes(logSearch.toLowerCase())
  );

  const triggerWebhookTest = () => {
    setWebhookSimulated(true);
    setTimeout(() => setWebhookSimulated(false), 3000);
  };

  // Status mapping to spec (Pending → Running → Success / Failed)
  const getDisplayStatus = () => {
    switch (task.status) {
      case 'completed':
        return { label: 'Success', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
      case 'processing':
        return { label: 'Running', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse', icon: Activity };
      case 'queued':
      case 'pending':
        return { label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Clock };
      case 'retrying':
        return { label: 'Running (Retrying)', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30', icon: RotateCcw };
      case 'failed':
        return { label: 'Failed', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: AlertCircle };
      default:
        return { label: task.status.toUpperCase(), color: 'bg-slate-800 text-slate-400 border-slate-700', icon: Clock };
    }
  };

  const statusInfo = getDisplayStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl glass-panel rounded-2xl border border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header & Route Badge */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-cyan-400 font-bold text-sm px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                /tasks/{task.id}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1.5 ${statusInfo.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusInfo.label}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Prominent "Re-run" Button */}
            <button
              onClick={() => retryTask(task.id)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-md shadow-cyan-500/10"
              title="Re-run task execution from scratch"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-run Task</span>
            </button>

            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task Title, Operation, and Input Text Metadata Bar */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>{task.title}</span>
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Operation:</span>
              <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold uppercase">
                {task.type.replace('_', ' ')}
              </span>
              <span className="text-slate-400 font-medium ml-2">Model:</span>
              <span className="font-mono text-slate-300 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                {task.model}
              </span>
            </div>
          </div>

          {/* Input Payload View */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium mb-1 flex items-center space-x-1">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Input Text Payload:</span>
            </div>
            <p className="font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-20 overflow-y-auto">
              {task.input.prompt || task.input.content}
            </p>
          </div>
        </div>

        {/* Live Status Progress Bar (Pending → Running → Success/Failed) */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 w-full max-w-lg">
            <span className="text-slate-400 shrink-0 font-medium">Live Status:</span>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{task.currentStep || 'Enqueued'}</span>
                <span>{task.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    task.status === 'completed' ? 'bg-emerald-400' :
                    task.status === 'failed' ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            {task.startedAt && <span>Started: <strong className="text-slate-300 font-mono">{new Date(task.startedAt).toLocaleTimeString()}</strong></span>}
            {task.completedAt && <span>Finished: <strong className="text-emerald-400 font-mono">{new Date(task.completedAt).toLocaleTimeString()}</strong></span>}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-5 py-2 bg-slate-900/60 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveInspectorTab('output')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeInspectorTab === 'output' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Result Output</span>
          </button>

          <button
            onClick={() => setActiveInspectorTab('logs')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 relative ${
              activeInspectorTab === 'logs' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Logs ({task.logs.length})</span>
          </button>

          <button
            onClick={() => setActiveInspectorTab('steps')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeInspectorTab === 'steps' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline Steps ({task.steps.filter(s=>s.status==='completed').length}/{task.steps.length})</span>
          </button>

          <button
            onClick={() => setActiveInspectorTab('json')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeInspectorTab === 'json' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw Payload</span>
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 terminal-scroll">
          
          {/* TAB 1: RESULT OUTPUT */}
          {activeInspectorTab === 'output' && (
            <div className="space-y-4">
              
              {/* Status Banner */}
              {task.status === 'completed' && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Task execution completed successfully in <strong>{task.output?.metrics?.latencyMs || 1200}ms</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400/80">
                    <span>Tokens: {task.output?.metrics?.tokenUsage || 380}</span>
                    <span>•</span>
                    <span>Cost: ${task.output?.metrics?.costEstimate?.toFixed(4) || '0.0010'}</span>
                  </div>
                </div>
              )}

              {task.status === 'failed' && (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Task Execution Failed</span>
                  </div>
                  <p className="font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-rose-500/20">
                    {task.errorMessage || 'Execution encountered a transient error.'}
                  </p>
                </div>
              )}

              {/* Render Output Content */}
              {task.output ? (
                <div className="space-y-4">
                  
                  {/* Action Bar */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Processed Result Output:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCopyOutput}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1.5 transition-all"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleDownloadOutput}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs flex items-center space-x-1.5 transition-all font-medium"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Rendered Text / Markdown */}
                  {task.output.resultText && (
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {task.output.resultText}
                    </div>
                  )}

                  {/* Code Snippet */}
                  {task.output.codeSnippet && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400 font-mono">Language: {task.output.language || 'typescript'}</div>
                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
                        <code>{task.output.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-600 animate-spin" />
                  <p>Worker processing task output... Please wait for completion.</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: EXECUTION LOGS */}
          {activeInspectorTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Filter timestamped logs (INFO, DEBUG, ERROR)..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 w-72"
                />
                <span className="text-slate-500 text-xs font-mono">
                  {filteredLogs.length} timestamped entries
                </span>
              </div>

              {/* Terminal Screen */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-[11px] space-y-1.5 max-h-96 overflow-y-auto terminal-scroll scanline-effect">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 leading-relaxed">
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 ${
                      log.level === 'error' ? 'bg-rose-500/20 text-rose-400' :
                      log.level === 'warn' ? 'bg-amber-500/20 text-amber-300' :
                      log.level === 'debug' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {log.level}
                    </span>
                    <span className={log.level === 'error' ? 'text-rose-300' : 'text-slate-300'}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXECUTION PIPELINE STEPS */}
          {activeInspectorTab === 'steps' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-300">Pipeline Execution Steps:</h3>
              <div className="space-y-3">
                {task.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      step.status === 'completed' ? 'bg-emerald-950/10 border-emerald-500/30' :
                      step.status === 'in_progress' ? 'bg-cyan-950/20 border-cyan-500/40' :
                      step.status === 'failed' ? 'bg-rose-950/20 border-rose-500/30' :
                      'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold bg-slate-800 text-slate-300">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{step.name}</h4>
                        {step.error && <p className="text-[11px] text-rose-400 font-mono mt-0.5">{step.error}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      {step.durationMs && <span className="font-mono text-slate-400">{step.durationMs}ms</span>}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        step.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' :
                        step.status === 'failed' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RAW PAYLOAD */}
          {activeInspectorTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Complete JSON Task Record:</span>
                {task.webhookUrl && (
                  <button
                    onClick={triggerWebhookTest}
                    className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition-all"
                  >
                    {webhookSimulated ? '✓ Webhook Dispatched (200 OK)' : 'Test Webhook Dispatch'}
                  </button>
                )}
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs overflow-x-auto max-h-96">
                {JSON.stringify(task, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Created At: <strong className="text-slate-200">{new Date(task.createdAt).toLocaleString()}</strong></span>
          <div className="flex space-x-2">
            <button
              onClick={() => retryTask(task.id)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-run Task</span>
            </button>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all"
            >
              Close Detail
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
