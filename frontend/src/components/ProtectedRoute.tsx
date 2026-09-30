import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-6 font-mono text-[#181816]">
        <div className="bg-white border border-[#3A3A38]/20 p-8 max-w-sm w-full text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#1A3C2B] animate-spin mx-auto" />
          <div>
            <h3 className="font-grotesk font-bold text-sm tracking-wider uppercase text-[#181816]">
              AUTHENTICATING SESSION
            </h3>
            <p className="text-xs text-[#5A5A55] mt-1 font-sans">Verifying security credentials with Supabase...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
