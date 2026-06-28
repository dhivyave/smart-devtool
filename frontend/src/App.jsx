import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './components/ThemeContext';
import LandingPage from './components/LandingPage';

import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';
import AIAssistantPage from './pages/AIAssistantPage';
import ProfilePage from './pages/ProfilePage';

// ─── MAIN APP WRAPPER ────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <SignedOut>
            <LandingPage />
          </SignedOut>
          <SignedIn>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/analysis/:id" element={<AnalysisPage />} />
                <Route path="/analysis" element={<Navigate to="/" replace />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/assistant" element={<AIAssistantPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </SignedIn>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
