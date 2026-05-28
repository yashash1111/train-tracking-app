import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { LiveTracking } from './pages/LiveTracking';
import { Trains } from './pages/Trains';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { useAuth } from './context/AuthContext';
import { Loader2, TrainFront } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const { loading } = useAuth();
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowApp(true), 1500); // Cinematic delay
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || !showApp) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center font-mono">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-500 dark:bg-yellow-500/20 blur-3xl rounded-full" />
          <div className="h-24 w-24 rounded-full border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative z-10 shadow-2xl">
            <TrainFront className="h-12 w-12 text-yellow-600 dark:text-yellow-500 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-8 text-xl font-bold tracking-[0.2em] text-yellow-600 dark:text-yellow-400 uppercase">
          RAIL NETWORK SYS
        </h2>
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="h-1 w-48 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 dark:bg-yellow-500 rounded-full w-1/2 animate-[slide_1.5s_ease-in-out_infinite]" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-widest animate-pulse">Initializing Data Uplink...</span>
        </div>
        
        <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased">
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: '!bg-slate-50 dark:bg-slate-900 !text-slate-900 dark:text-slate-100 !border !border-slate-200 dark:border-slate-800 !font-mono !text-xs !shadow-2xl',
          success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#0f172a' } },
        }} 
      />
      <Navbar />
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Landing />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/live-map" element={
          <ProtectedRoute>
            <LiveTracking />
          </ProtectedRoute>
        } />
        <Route path="/trains" element={
          <ProtectedRoute>
            <Trains />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
