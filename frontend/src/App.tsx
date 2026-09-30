import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useHealth } from './hooks/useDataset';
import { Dashboard } from './pages/Dashboard';
import { Datasets } from './pages/Datasets';
import { ProfilePage } from './pages/Profile';
import { AIAnalysis } from './pages/AIAnalysis';
import { CleaningPlanPage } from './pages/CleaningPlan';
import { PreviewPage } from './pages/Preview';
import { ValidationPage } from './pages/Validation';
import { HistoryPage } from './pages/History';

export const App: React.FC = () => {
  const { health, loading } = useHealth();

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <Navbar health={health} loading={loading} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 bg-slate-900">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:datasetId" element={<ProfilePage />} />
              <Route path="/analysis" element={<AIAnalysis />} />
              <Route path="/analysis/:datasetId" element={<AIAnalysis />} />
              <Route path="/ai-analysis/:datasetId" element={<AIAnalysis />} />
              <Route path="/plan" element={<CleaningPlanPage />} />
              <Route path="/plan/:datasetId" element={<CleaningPlanPage />} />
              <Route path="/preview" element={<PreviewPage />} />
              <Route path="/preview/:datasetId" element={<PreviewPage />} />
              <Route path="/validation" element={<ValidationPage />} />
              <Route path="/validation/:datasetId" element={<ValidationPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:datasetId" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
