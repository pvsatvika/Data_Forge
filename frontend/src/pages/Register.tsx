import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, Loader2, AlertCircle, CheckCircle2, Terminal, UserPlus, Sun, Moon } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { formatAuthError, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<boolean>(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen bg-[#F6F4F0] dark:bg-[#121114] text-[#2B2827] dark:text-[#F0EDEA] flex flex-col justify-center items-center p-6 font-sans relative transition-colors duration-150">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2 bg-white dark:bg-[#19181C] hover:bg-[#EFECE6] dark:hover:bg-[#2A2730] text-[#2B2827] dark:text-[#F0EDEA] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg flex items-center justify-center transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-[#6E6966]" />
          ) : (
            <Sun className="w-4 h-4 text-[#9E5A61]" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-8 shadow-sm space-y-6">
        {/* Header Branding */}
        <div className="space-y-2 text-center border-b border-[#E5E0D8] dark:border-[#29262C] pb-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#7E454B] text-white font-mono text-[10px] uppercase font-bold tracking-widest rounded-md">
            <Terminal className="w-3 h-3 text-white" />
            NEW OPERATOR REGISTRATION
          </div>
          <h2 className="font-grotesk font-bold text-xl text-[#2B2827] dark:text-[#F0EDEA] tracking-tight uppercase">
            Create Data Forge Account
          </h2>
          <p className="text-xs text-[#6E6966] dark:text-[#9E9793] font-sans">
            Register your operator credentials to manage data pipelines and automated validation suites.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 font-sans">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-mono font-bold block text-[11px] uppercase">REGISTRATION ERROR</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {registeredSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-700 dark:text-emerald-400 text-xs space-y-2 font-sans">
              <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                REGISTRATION SUBMITTED SUCCESSFULLY
              </div>
              <p className="leading-relaxed">
                Your account registration request has been processed. Because email confirmation is enabled in Supabase,
                <strong> please check your email inbox for the confirmation link</strong> to verify your email before signing in.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full py-3 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#7E454B] block text-center"
            >
              [ PROCEED TO LOGIN ]
            </Link>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] font-bold text-[#2B2827] dark:text-[#F0EDEA] uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="operator@dataforge.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-[#29262C] text-xs font-mono text-[#2B2827] dark:text-[#F0EDEA] px-3 py-2.5 pl-9 rounded-lg focus:outline-none focus:border-[#7E454B] dark:focus:border-[#9E5A61]"
                />
                <Mail className="w-4 h-4 text-[#6E6966] dark:text-[#9E9793] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold text-[#2B2827] dark:text-[#F0EDEA] uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-[#29262C] text-xs font-mono text-[#2B2827] dark:text-[#F0EDEA] px-3 py-2.5 pl-9 rounded-lg focus:outline-none focus:border-[#7E454B] dark:focus:border-[#9E5A61]"
                />
                <Lock className="w-4 h-4 text-[#6E6966] dark:text-[#9E9793] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold text-[#2B2827] dark:text-[#F0EDEA] uppercase mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-[#29262C] text-xs font-mono text-[#2B2827] dark:text-[#F0EDEA] px-3 py-2.5 pl-9 rounded-lg focus:outline-none focus:border-[#7E454B] dark:focus:border-[#9E5A61]"
                />
                <Lock className="w-4 h-4 text-[#6E6966] dark:text-[#9E9793] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#7E454B] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  CREATING ACCOUNT...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-white" />
                  [ REGISTER OPERATOR ACCOUNT ]
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        {!registeredSuccess && (
          <div className="pt-4 border-t border-[#E5E0D8] dark:border-[#29262C] text-center font-mono text-xs text-[#6E6966] dark:text-[#9E9793]">
            Already registered?{' '}
            <Link
              to="/login"
              className="text-[#7E454B] dark:text-[#9E5A61] font-bold underline uppercase"
            >
              [ BACK TO LOGIN ]
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
