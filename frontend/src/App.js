// App.jsx
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { InterviewProvider } from './contexts/InterviewContext';
import ProtectedRoute from './components/ProtectedRoute';
import './i18n';

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
import AdaptiveSessionDetailPage from './Pages/AdaptiveSessionDetailPage';


function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>   {/* 👈 BỌC AuthProvider */}
          <InterviewProvider>
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
              // App.jsx - sửa dòng này
              <Route path="/adaptive-history/:sessionId" element={<ProtectedRoute><AdaptiveSessionDetailPage /></ProtectedRoute>} />
            </Routes>
          </InterviewProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;