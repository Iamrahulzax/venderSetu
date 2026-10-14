import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, googleLogin, switchDemoUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await googleLogin('rahul.sharma@campus.edu.in', 'Rahul Sharma (Google)');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPassword = 'Seller@123') => {
    try {
      setLoading(true);
      await switchDemoUser(demoEmail, demoPassword);
      if (demoEmail === 'admin@vendersetu.edu.in') {
        navigate('/admin');
      } else if (demoEmail === 'student@vendersetu.edu.in') {
        navigate('/');
      } else {
        navigate('/seller');
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6 pb-16">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-emerald-600/20">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 brand-font">Welcome to VenderSetu</h1>
          <p className="text-xs text-slate-500">Your Campus, Your Stores, Connected.</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Campus Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="student@vendersetu.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-emerald-600/20"
          >
            {loading ? 'Authenticating...' : 'Sign In to VenderSetu'}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-semibold">
            Or continue with
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign In with Campus Google Account</span>
        </button>

        {/* 1-Click Demo Personas */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>1-Click Test Personas</span>
            </span>
            <span className="text-slate-400 text-[10px]">Instant Login</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => handleQuickDemo('student@vendersetu.edu.in', 'Student@123')}
              className="p-1.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-left text-slate-800 font-medium truncate"
            >
              🎓 Student
            </button>
            <button
              onClick={() => handleQuickDemo('canteen@vendersetu.edu.in')}
              className="p-1.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-left text-slate-800 font-medium truncate"
            >
              🏪 College Canteen
            </button>
            <button
              onClick={() => handleQuickDemo('durga@vendersetu.edu.in')}
              className="p-1.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-left text-slate-800 font-medium truncate"
            >
              🍔 Durga Fast Food
            </button>
            <button
              onClick={() => handleQuickDemo('monal@vendersetu.edu.in')}
              className="p-1.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-left text-slate-800 font-medium truncate"
            >
              🥟 Monal Fast Food
            </button>
            <button
              onClick={() => handleQuickDemo('bhandari@vendersetu.edu.in')}
              className="p-1.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-left text-slate-800 font-medium truncate"
            >
              📚 Bhandari Store
            </button>
            <button
              onClick={() => handleQuickDemo('devbhoomi@vendersetu.edu.in')}
              className="p-1.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-left text-slate-800 font-medium truncate"
            >
              🛒 Devbhoomi Store
            </button>
          </div>

          <button
            onClick={() => handleQuickDemo('admin@vendersetu.edu.in', 'Admin@123')}
            className="w-full mt-1 p-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-lg text-center font-bold text-[11px]"
          >
            🛡️ Platform Administrator
          </button>
        </div>

        <div className="text-center text-xs text-slate-500">
          New student?{' '}
          <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
