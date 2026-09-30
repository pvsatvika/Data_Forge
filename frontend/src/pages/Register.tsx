import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, AlertCircle, CheckCircle2, Terminal, UserPlus } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { formatAuthError, user } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<boolean>(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required registration fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password entry.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(formatAuthError(authError));
        setLoading(false);
        return;
      }

      setLoading(false);
      setRegisteredSuccess(true);
    } catch (err: any) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-[#3A3A38]/20 p-8 shadow-sm space-y-6">
        {/* Header Branding */}
        <div className="space-y-2 text-center border-b border-[#3A3A38]/20 pb-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#1A3C2B] text-[#9EFFBF] font-mono text-[10px] uppercase font-bold tracking-widest">
            <Terminal className="w-3 h-3 text-[#9EFFBF]" />
            NEW OPERATOR REGISTRATION
          </div>
          <h2 className="font-grotesk font-bold text-xl text-[#181816] tracking-tight uppercase">
            Create Data Forge Account
          </h2>
          <p className="text-xs text-[#5A5A55] font-sans">
            Register your operator credentials to manage data pipelines and automated validation suites.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2 font-sans">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-mono font-bold block text-[11px] uppercase">REGISTRATION ERROR</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {registeredSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-2 font-sans">
              <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase text-[#1A3C2B]">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                REGISTRATION SUBMITTED SUCCESSFULLY
              </div>
              <p className="leading-relaxed">
                Your account registration request has been processed. Because email confirmation is enabled in Supabase,
                <strong> please check your email inbox for the confirmation link</strong> to verify your email before signing in.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full py-3 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-mono text-xs font-bold rounded-none flex items-center justify-center gap-2 transition-colors border border-[#9EFFBF]/30 block text-center"
            >
              [ PROCEED TO LOGIN ]
            </Link>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] font-bold text-[#181816] uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="operator@dataforge.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#3A3A38]/20 text-xs font-mono text-[#181816] px-3 py-2.5 pl-9 rounded-none focus:outline-none focus:border-[#1A3C2B]"
                />
                <Mail className="w-4 h-4 text-[#5A5A55] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold text-[#181816] uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#3A3A38]/20 text-xs font-mono text-[#181816] px-3 py-2.5 pl-9 rounded-none focus:outline-none focus:border-[#1A3C2B]"
                />
                <Lock className="w-4 h-4 text-[#5A5A55] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold text-[#181816] uppercase mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-[#3A3A38]/20 text-xs font-mono text-[#181816] px-3 py-2.5 pl-9 rounded-none focus:outline-none focus:border-[#1A3C2B]"
                />
                <Lock className="w-4 h-4 text-[#5A5A55] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-mono text-xs font-bold rounded-none flex items-center justify-center gap-2 transition-colors border border-[#9EFFBF]/30 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#9EFFBF]" />
                  CREATING ACCOUNT...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#9EFFBF]" />
                  [ REGISTER OPERATOR ACCOUNT ]
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        {!registeredSuccess && (
          <div className="pt-4 border-t border-[#3A3A38]/20 text-center font-mono text-xs text-[#5A5A55]">
            Already registered?{' '}
            <Link
              to="/login"
              className="text-[#1A3C2B] font-bold underline hover:text-[#25523b] uppercase"
            >
              [ BACK TO LOGIN ]
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
