import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import BackToTop from './components/BackToTop';
import PrivateRoute from './routes/PrivateRoute';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DiscoveryPage from './features/discovery/DiscoveryPage';
import OnboardingPage from './features/onboarding/OnboardingPage';
import CommunityPage from './features/community/CommunityPage';
import TrackingPage from './features/tracking/TrackingPage';
import TrackingDetailPage from './features/tracking/TrackingDetailPage';
import ProfilePage from './features/profile/ProfilePage';
import FeedPage from './features/feed/FeedPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import StatsPage from './features/stats/StatsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/discovery" element={<><Navbar /><DiscoveryPage /></>} />
            <Route path="/anime/:id" element={<><Navbar /><CommunityPage /></>} />
            <Route
              path="/onboarding"
              element={
                <PrivateRoute>
                  <OnboardingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <PrivateRoute>
                  <Navbar />
                  <TrackingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/tracking/:malId/details"
              element={
                <PrivateRoute>
                  <Navbar />
                  <TrackingDetailPage />
                </PrivateRoute>
              }
            />
            <Route path="/perfil/:nickname" element={<><Navbar /><ProfilePage /></>} />
            <Route path="/stats" element={<><Navbar /><StatsPage /></>} />
            <Route path="/feed" element={<><Navbar /><FeedPage /></>} />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Navbar />
                  <NotificationsPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/discovery" replace />} />
          </Routes>
            <BackToTop />
          </BrowserRouter>
        </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
