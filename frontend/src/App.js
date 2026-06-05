// App.jsx
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { InterviewProvider } from './contexts/InterviewContext';
import ProtectedRoute from './components/ProtectedRoute';
import './i18n';
import { Toaster } from 'react-hot-toast';

import Register from './Pages/Register';
import Login from './Pages/Login';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import VerifyOTP from './Pages/VerifyOTP';
import WelcomePage from './Pages/WellcomePage';
import ProfilePage from './Pages/ProfilePage';
import SettingsPage from './Pages/SettingsPage';
import HelpSupportPage from './Pages/HelpSupportPage';
import InterviewPage from './Pages/InterviewPage';
import HistoryPage from './Pages/HistoryPage';
import InterviewDetailPag from './Pages/InterviewDetailPage';
import InterviewCVPage from './Pages/InterviewCVPage';
import { CVInfoModal } from './components/CVInfoModal';
import CVHistoryDetailPage from './Pages/CVHistoryDetailPage';
import InterviewDetailPage from './Pages/InterviewDetailPage';
import AdaptiveInterviewPage from './Pages/AdaptiveInterviewPage';
import AdaptiveHistoryPage from './Pages/AdaptiveHistoryPage';
import InterviewHistoryPage from './Pages/InterviewHistoryPage';
import CVHistoryPage from './Pages/CVHistoryPage';
import AdaptiveSessionDetailPage from './Pages/AdaptiveSessionDetailPage';
import LiveCodingPage from './Pages/LiveCodingPage';
import CodingHistoryPage from './Pages/CodingHistoryPage';
import CodingHistoryDetailPage from './Pages/CodingHistoryDetailPage';
import { HistoryProvider } from './contexts/HistoryContext';

function App() {
  return (
    <ThemeProvider>
      
        <AuthProvider>
          <InterviewProvider>
            <HistoryProvider>
              <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />

                {/* Protected routes */}
                <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><HelpSupportPage /></ProtectedRoute>} />
                <Route path="/interview" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                <Route path="/history/:id" element={<ProtectedRoute><InterviewDetailPag /></ProtectedRoute>} />
                <Route path="/cvinfo" element={<ProtectedRoute><CVInfoModal /></ProtectedRoute>} />
                <Route path="/cvinterview" element={<ProtectedRoute><InterviewCVPage /></ProtectedRoute>} />
                <Route path="/cv-history/:id" element={<ProtectedRoute><CVHistoryDetailPage /></ProtectedRoute>} />
                <Route path="/adaptive-interview" element={<ProtectedRoute><AdaptiveInterviewPage /></ProtectedRoute>} />
                <Route path="/adaptive-history" element={<ProtectedRoute><AdaptiveHistoryPage /></ProtectedRoute>} />
                <Route path="/interview-history" element={<ProtectedRoute><InterviewHistoryPage /></ProtectedRoute>} />
                <Route path="/cv-history" element={<ProtectedRoute><CVHistoryPage /></ProtectedRoute>} />
                <Route path="/adaptive-history/:sessionId" element={<ProtectedRoute><AdaptiveSessionDetailPage /></ProtectedRoute>} />

                {/* Route cho Live Coding */}
                <Route path="/live-coding" element={<ProtectedRoute><LiveCodingPage /></ProtectedRoute>} />
                <Route path="/coding-history" element={<ProtectedRoute><CodingHistoryPage /></ProtectedRoute>} />
                <Route path="/coding-history/:sessionId" element={<ProtectedRoute><CodingHistoryDetailPage /></ProtectedRoute>} />
              </Routes>
            </HistoryProvider>
          </InterviewProvider>
        </AuthProvider>
      
    </ThemeProvider>
  );
}

export default App;