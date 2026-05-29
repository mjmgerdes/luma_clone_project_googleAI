import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, Sparkles, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const redirectUri = window.location.origin;

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUri,
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;

        if (data.user && data.session) {
          // Auto logged in (email verification might be off)
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          // Email confirmation is required
          setSuccessMsg('Sign up successful! Please check your email inbox to verify your account and refresh this page. Since we pass the active origin, verifying will take you right back here.');
        }
      } else {
        // Log In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        setSuccessMsg('Logged in successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Let's use a standard public credential for testing
    // If it doesn't exist, we will attempt to sign up first, then sign in.
    const demoEmail = 'guest@myluma.com';
    const demoPassword = 'password123';
    const demoName = 'Event Aficionado';

    try {
      // Try to sign in or if missing sign up first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) {
        // Signin failed, let's try to sign up the demo user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              full_name: demoName,
            }
          }
        });

        if (signUpError) {
          throw new Error('Demo account login failed. If this is a fresh database, please run the SQL setup script first, or sign up with a custom email if Supabase Auth is enabled!');
        }

        setSuccessMsg('Universal demo account registered and authorized!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setSuccessMsg('Authorized instantly as demo guest!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error configuring demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" id="auth-modal-overlay">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-all duration-300" id="auth-modal-container">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          id="close-auth-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100" id="auth-modal-title">
            {isSignUp ? 'Create your account' : 'Welcome to My AI Luma'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Join the community, host events, and participate in real-time.
          </p>
        </div>

        {/* Main Error/Success Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-start space-x-2" id="auth-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-start space-x-2" id="auth-success">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4" id="auth-submit-form">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required={isSignUp}
                  placeholder="Taylor Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="auth-fullName-input"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="taylor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                id="auth-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                id="auth-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                id="password-visibility-btn"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 active:scale-98 font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-300 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></span>
            ) : (
              <span>{isSignUp ? 'Sign Up' : 'Log In'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">Or play standard</span>
          </div>
        </div>

        {/* Quick Guest login option */}
        <button
          onClick={handleDemoSignIn}
          disabled={loading}
          className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold transition-all active:scale-98 flex items-center justify-center space-x-2 border border-blue-100/50 dark:border-blue-900/50"
          id="demo-guest-login-btn"
        >
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>Quick Guest Login (Demo Mode)</span>
        </button>

        {/* Switch Form Link */}
        <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Create Account
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
