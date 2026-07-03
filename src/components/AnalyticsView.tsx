import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { BarChart2, TrendingUp, Cpu, Clock, Zap } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { tasks } = useTaskContext();

  // Hourly completion trends mock/computed data
  const throughputData = [
    { time: '13:00', completed: 12, failed: 1, latencyms: 1420 },
    { time: '14:00', completed: 18, failed: 0, latencyms: 1350 },
    { time: '15:00', completed: 25, failed: 2, latencyms: 1680 },
    { time: '16:00', completed: 32, failed: 1, latencyms: 1290 },
    { time: '17:00', completed: tasks.filter(t => t.status === 'completed').length, failed: tasks.filter(t => t.status === 'failed').length, latencyms: 1450 },
  ];

  // Model usage distribution
  const modelUsageMap: Record<string, number> = {};
  tasks.forEach(t => {
    modelUsageMap[t.model] = (modelUsageMap[t.model] || 0) + 1;
  });

  const modelPieData = Object.keys(modelUsageMap).map(model => ({
    name: model,
    value: modelUsageMap[model],
  }));

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  // Error breakdown categories
  const errorBreakdownData = [
    { name: 'Gateway Timeout (504)', count: 4, color: '#f43f5e' },
    { name: 'Model Rate Limit (429)', count: 2, color: '#f59e0b' },
    { name: 'Context Length Exceeded', count: 1, color: '#a855f7' },
    { name: 'Worker Preemption', count: 1, color: '#64748b font-normal' },
  ];

  const totalTokens = tasks.reduce((acc, t) => acc + (t.output?.metrics?.tokenUsage || 0), 0);
  const totalCost = tasks.reduce((acc, t) => acc + (t.output?.metrics?.costEstimate || 0), 0).toFixed(4);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart2 className="w-4 h-4" />
            <span>Telemetry & Operational Intelligence</span>
          </div>
          <h2 className="text-xl font-bold text-white">Cluster Performance & Token Analytics</h2>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Total Tokens:</span>{' '}
            <strong className="text-cyan-300 font-mono">{totalTokens.toLocaleString()}</strong>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Cumulative Cost:</span>{' '}
            <strong className="text-emerald-400 font-mono">${totalCost}</strong>
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Throughput & Model Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Task Throughput Volume */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Task Throughput & Completion Volume</span>
              </h3>
              <p className="text-xs text-slate-400">Completed vs Failed tasks per hour</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Avg SLA: 98.4%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCompleted)" name="Completed Tasks" />
                <Bar dataKey="failed" fill="#f43f5e" name="Failed Tasks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Model Usage Share */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Model Usage Distribution</span>
            </h3>
            <p className="text-xs text-slate-400">Task breakdown by LLM model</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modelPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {modelPieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-300 font-mono">{entry.name}</span>
                </div>
                <span className="text-slate-400 font-semibold">{entry.value} tasks</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Latency & Error Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Latency Percentiles */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Execution Latency Percentiles</span>
          </h3>
          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">P50 Latency</span>
              <strong className="text-lg font-bold text-white font-mono">820 ms</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">P90 Latency</span>
              <strong className="text-lg font-bold text-cyan-300 font-mono">1,450 ms</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">P99 Latency</span>
              <strong className="text-lg font-bold text-amber-400 font-mono">2,890 ms</strong>
            </div>
          </div>
        </div>

        {/* Error Category Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Failure Analysis & Dead-Letter Queue</span>
          </h3>
          <div className="space-y-2 pt-1 text-xs">
            {errorBreakdownData.map(e => (
              <div key={e.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">{e.name}</span>
                <span className="font-mono text-rose-400 font-semibold">{e.count} occurrences</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
