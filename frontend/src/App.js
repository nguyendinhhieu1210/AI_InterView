import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { InterviewProvider } from './contexts/InterviewContext';
import { HistoryProvider } from './contexts/HistoryContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

// Auth pages
import Register from './Pages/Register';
import Login from './Pages/Login';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import VerifyOTP from './Pages/VerifyOTP';

// User pages
import WelcomePage from './Pages/WellcomePage';
import ProfilePage from './Pages/ProfilePage';
import SettingsPage from './Pages/SettingsPage';
import HelpSupportPage from './Pages/HelpSupportPage';
import InterviewPage from './Pages/InterviewPage';
import HistoryPage from './Pages/HistoryPage';
import InterviewDetailPage from './Pages/InterviewDetailPage';
import InterviewCVPage from './Pages/InterviewCVPage';
import { CVInfoModal } from './components/CVInfoModal';
import CVHistoryDetailPage from './Pages/CVHistoryDetailPage';
import AdaptiveInterviewPage from './Pages/AdaptiveInterviewPage';
import AdaptiveHistoryPage from './Pages/AdaptiveHistoryPage';
import InterviewHistoryPage from './Pages/InterviewHistoryPage';
import CVHistoryPage from './Pages/CVHistoryPage';
import AdaptiveSessionDetailPage from './Pages/AdaptiveSessionDetailPage';
import LiveCodingPage from './Pages/LiveCodingPage';
import CodingHistoryPage from './Pages/CodingHistoryPage';
import CodingHistoryDetailPage from './Pages/CodingHistoryDetailPage';
import UserExamSetsPage from './Pages/UserExamSetsPage';
import UserExamDetailPage from './Pages/UserExamDetailPage';

// Home page
import HomePage from './Pages/homepage/HomePage';

// Admin pages
import AdminLayout from './layouts/AdminLayout';
import AdminRoute from './components/admin/AdminRoute';
import Dashboard from './Pages/admin/Dashboard';
import UsersList from './Pages/admin/UsersList';
import UserDetail from './Pages/admin/UserDetail';
import Interviews from './Pages/admin/Interviews';
import Settings from './Pages/admin/Settings';
import CVHistory from './Pages/admin/CVHistory';
import CodingSessions from './Pages/admin/CodingSessions';
import AdaptiveSessions from './Pages/admin/AdaptiveSessions';
import SystemLogs from './Pages/admin/SystemLogs';
import QuestionManagement from './Pages/admin/QuestionManagement';
import ExamSetManagement from './Pages/admin/ExamSetManagement';

// ─── Wrapper: Auth routes (cố định light, không bị ảnh hưởng theme user) ───
function AuthWrapper({ children }) {
  return (
    <ThemeProvider forcedTheme="light">
      <div className="light">{children}</div>
    </ThemeProvider>
  );
}

// ─── Wrapper: Admin routes (cố định light) ───
function AdminWrapper({ children }) {
  return (
    <ThemeProvider forcedTheme="light">
      <div className="light">{children}</div>
    </ThemeProvider>
  );
}

// ─── Wrapper: User routes (dùng theme theo từng user, đặt TRONG AuthProvider) ───
function UserProviders({ children }) {
  return (
    <ThemeProvider>
      <InterviewProvider>
        <HistoryProvider>{children}</HistoryProvider>
      </InterviewProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* ───── 1. AUTH ROUTES (public, cố định light) ───── */}
        <Route
          path="/register"
          element={
            <AuthWrapper>
              <Register />
            </AuthWrapper>
          }
        />
        <Route
          path="/login"
          element={
            <AuthWrapper>
              <Login />
            </AuthWrapper>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthWrapper>
              <ForgotPassword />
            </AuthWrapper>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthWrapper>
              <ResetPassword />
            </AuthWrapper>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <AuthWrapper>
              <VerifyOTP />
            </AuthWrapper>
          }
        />

        <Route path="/" element={<HomePage />} />

        {/* ───── 2. ADMIN ROUTES (cố định light, tách hoàn toàn) ───── */}
        <Route
          path="/admin"
          element={
            <AdminWrapper>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </AdminWrapper>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersList />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="cv-history" element={<CVHistory />} />
          <Route path="coding-sessions" element={<CodingSessions />} />
          <Route path="adaptive-sessions" element={<AdaptiveSessions />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="/admin/questions" element={<QuestionManagement />} />
          <Route path="/admin/exam-sets" element={<ExamSetManagement />} />
        </Route>

        {/* ───── 3. USER ROUTES (đăng nhập mới vào, theme theo từng user) ───── */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <UserProviders>
                <Routes>
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/help" element={<HelpSupportPage />} />
                  <Route path="/interview" element={<InterviewPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route
                    path="/history/:id"
                    element={<InterviewDetailPage />}
                  />
                  <Route path="/cvinfo" element={<CVInfoModal />} />
                  <Route path="/cvinterview" element={<InterviewCVPage />} />
                  <Route path="/cv-history" element={<CVHistoryPage />} />
                  <Route
                    path="/cv-history/:id"
                    element={<CVHistoryDetailPage />}
                  />
                  <Route
                    path="/adaptive-interview"
                    element={<AdaptiveInterviewPage />}
                  />
                  <Route
                    path="/adaptive-history"
                    element={<AdaptiveHistoryPage />}
                  />
                  <Route
                    path="/adaptive-history/:sessionId"
                    element={<AdaptiveSessionDetailPage />}
                  />
                  <Route
                    path="/interview-history"
                    element={<InterviewHistoryPage />}
                  />
                  <Route path="/live-coding" element={<LiveCodingPage />} />
                  <Route
                    path="/coding-history"
                    element={<CodingHistoryPage />}
                  />
                  <Route
                    path="/coding-history/:sessionId"
                    element={<CodingHistoryDetailPage />}
                  />
                  <Route path="/exam-sets" element={<UserExamSetsPage />} />
                  <Route path="/exam/:id" element={<UserExamDetailPage />} />
                </Routes>
              </UserProviders>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
