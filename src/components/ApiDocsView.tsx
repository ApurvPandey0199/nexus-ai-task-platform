import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Code2, Copy, Check, Terminal, Globe, Send } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const { createTask, setActiveTab } = useTaskContext();
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copied, setCopied] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Test request state
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    title: "Programmatic API Task",
    type: "summarization",
    model: "claude-3-5-sonnet",
    priority: "high",
    input: {
      prompt: "Summarize distributed system telemetry logs and latency spikes."
    },
    max_retries: 3,
    webhook_url: "https://api.orthonow.com/webhooks/task-completion"
  }, null, 2));

  const getCodeSnippet = () => {
    switch (selectedLanguage) {
      case 'curl':
        return `curl -X POST https://api.nexusai.internal/v1/tasks \\
  -H "Authorization: Bearer nx_live_94820a81f3e7" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Summarize Clinical SLA Logs",
    "type": "summarization",
    "model": "claude-3-5-sonnet",
    "priority": "high",
    "input": {
      "prompt": "Extract SLA violation details from system logs."
    },
    "max_retries": 3,
    "webhook_url": "https://api.orthonow.com/webhooks/task-completion"
  }'`;

      case 'javascript':
        return `import { NexusAI } from '@nexusai/sdk';

const client = new NexusAI({ apiKey: process.env.NEXUS_API_KEY });

const task = await client.tasks.create({
  title: 'Summarize Clinical SLA Logs',
  type: 'summarization',
  model: 'claude-3-5-sonnet',
  priority: 'high',
  input: {
    prompt: 'Extract SLA violation details from system logs.'
  },
  maxRetries: 3,
  webhookUrl: 'https://api.orthonow.com/webhooks/task-completion'
});

console.log('Enqueued task ID:', task.id);`;

      case 'python':
        return `import requests

url = "https://api.nexusai.internal/v1/tasks"
headers = {
    "Authorization": "Bearer nx_live_94820a81f3e7",
    "Content-Type": "application/json"
}
payload = {
    "title": "Summarize Clinical SLA Logs",
    "type": "summarization",
    "model": "claude-3-5-sonnet",
    "priority": "high",
    "input": {
        "prompt": "Extract SLA violation details from system logs."
    },
    "max_retries": 3
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestApiCall = () => {
    try {
      setIsSending(true);
      const parsed = JSON.parse(testPayload);

      setTimeout(() => {
        const createdTask = createTask({
          title: parsed.title || 'API Enqueued Task',
          type: parsed.type || 'summarization',
          model: parsed.model || 'claude-3-5-sonnet',
          priority: parsed.priority || 'high',
          input: parsed.input || { prompt: 'Sample API task' },
          maxRetries: parsed.max_retries || 3,
          webhookUrl: parsed.webhook_url,
        });

        setIsSending(false);
        setApiResponse(JSON.stringify({
          status: 201,
          statusText: 'Created',
          data: {
            task_id: createdTask.id,
            status: createdTask.status,
            priority: createdTask.priority,
            enqueued_at: createdTask.createdAt,
            assigned_worker: 'Worker-01',
            message: 'Task enqueued into distributed processing queue successfully.'
          }
        }, null, 2));
      }, 600);
    } catch (err: any) {
      setIsSending(false);
      setApiResponse(JSON.stringify({
        status: 400,
        error: 'Bad Request',
        message: 'Invalid JSON payload structure: ' + err.message
      }, null, 2));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Code2 className="w-4 h-4" />
            <span>Developer API Reference</span>
          </div>
          <h2 className="text-xl font-bold text-white">REST API & Webhook Integration Specs</h2>
        </div>

        <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          Endpoint: https://api.nexusai.internal/v1
        </span>
      </div>

      {/* Main Grid: Code Generator & Interactive Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Code Generator */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>SDK & HTTP Snippet Generator</span>
            </h3>

            {/* Language Selector */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {(['curl', 'javascript', 'python'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-all ${
                    selectedLanguage === lang ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Snippet Block */}
          <div className="relative">
            <button
              onClick={handleCopyCode}
              className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-all z-10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed pt-10">
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>

          {/* Endpoints Table */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-slate-300">Available Endpoints:</h4>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-emerald-400 font-bold">POST</span>
                <span className="text-slate-200">/v1/tasks</span>
                <span className="text-slate-500">Enqueue Task</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-blue-400 font-bold">GET</span>
                <span className="text-slate-200">/v1/tasks/:id</span>
                <span className="text-slate-500">Poll Status</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-amber-400 font-bold">POST</span>
                <span className="text-slate-200">/v1/tasks/:id/retry</span>
                <span className="text-slate-500">Trigger Retry</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-rose-400 font-bold">DELETE</span>
                <span className="text-slate-200">/v1/tasks/:id</span>
                <span className="text-slate-500">Cancel Task</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live API Sandbox */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Interactive API Sandbox</span>
            </h3>
            <span className="text-xs text-slate-400">Simulate REST POST Request</span>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-300 text-xs font-semibold">Request Body (JSON):</label>
            <textarea
              rows={8}
              value={testPayload}
              onChange={e => setTestPayload(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500/50"
            ></textarea>
          </div>

          <button
            onClick={handleTestApiCall}
            disabled={isSending}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Sending Request...' : 'Execute POST /v1/tasks'}</span>
          </button>

          {/* Response Box */}
          {apiResponse && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Response Payload:</span>
                <button
                  onClick={() => {
                    setActiveTab('tasks');
                  }}
                  className="text-cyan-400 hover:underline"
                >
                  View in Task Queue →
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 font-mono text-xs overflow-x-auto max-h-48">
                {apiResponse}
              </pre>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
