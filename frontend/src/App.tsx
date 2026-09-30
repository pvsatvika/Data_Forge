import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { useHealth } from './hooks/useDataset';

import { LandingPage } from './pages/Landing';
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
    <div className="min-h-screen bg-[#F6F4F0] dark:bg-[#121114] text-[#2B2827] dark:text-[#F0EDEA] flex flex-col font-sans selection:bg-[#7E454B] selection:text-white transition-colors duration-150">
      <Navbar health={health} loading={loading} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 bg-[#F6F4F0] dark:bg-[#121114] transition-colors duration-150 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white font-mono text-xs">
        Loading DataForge Engine...
      </div>
    );
  }

  if (user) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/landing" element={<LandingPage />} />
            
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Root Route */}
            <Route path="/" element={<RootRoute />} />

            {/* Protected Data Forge Application Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
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
    </ThemeProvider>
  );
};

export default App;
