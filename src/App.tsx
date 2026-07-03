import React from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TaskTableView } from './components/TaskTableView';
import { AnalyticsView } from './components/AnalyticsView';
import { ApiDocsView } from './components/ApiDocsView';
import { CreateTaskModal } from './components/CreateTaskModal';
import { TaskInspectorModal } from './components/TaskInspectorModal';
import { WorkerSettingsModal } from './components/WorkerSettingsModal';
import { AuthModal } from './components/AuthModal';

const MainContent: React.FC = () => {
  const { activeTab } = useTaskContext();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'tasks' && <TaskTableView />}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'api' && <ApiDocsView />}

      {/* Modals & Slide-overs */}
      <CreateTaskModal />
      <TaskInspectorModal />
      <WorkerSettingsModal />
      <AuthModal />
    </main>
  );
};

export function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
          <Navbar />
          <MainContent />
        </div>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
