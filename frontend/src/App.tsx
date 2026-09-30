import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useHealth } from './hooks/useDataset';

import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Datasets } from './pages/Datasets';
import { ProfilePage } from './pages/Profile';
import { AIAnalysis } from './pages/AIAnalysis';
import { CleaningPlanPage } from './pages/CleaningPlan';
import { PreviewPage } from './pages/Preview';
import { ValidationPage } from './pages/Validation';
import { HistoryPage } from './pages/History';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { health, loading } = useHealth();

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#181816] flex flex-col font-sans selection:bg-[#1A3C2B] selection:text-white">
      <Navbar health={health} loading={loading} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 bg-[#F7F7F5]">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Data Forge Application Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
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
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
