import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { axiosClient } from '../../api/axiosClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  Boxes,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'demo@stocksense.app',
      password: 'Demo@1234',
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setError('');
      const res = await axiosClient.post('/auth/login', data);
      setAuth(res.data.data.user, res.data.data.token);
      toast.success(`Welcome back, ${res.data.data.user.name}!`);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleInstantDemoLogin = async () => {
    setDemoLoading(true);
    setValue('email', 'demo@stocksense.app');
    setValue('password', 'Demo@1234');
    try {
      const res = await axiosClient.post('/auth/login', {
        email: 'demo@stocksense.app',
        password: 'Demo@1234',
      });
      setAuth(res.data.data.user, res.data.data.token);
      toast.success('Signed in as Demo Administrator');
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      {/* BRAND HERO COLUMN (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border p-12 flex-col justify-between relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight gradient-text">StockSense</div>
            <div className="text-xs text-muted-foreground font-semibold">Enterprise Inventory Intelligence</div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-8 z-10 my-auto max-w-lg">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Client-Side Standalone Architecture
            </span>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
              Next-generation supply chain control with zero backend setup.
            </h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Designed for modern logistics teams. Track multi-facility stock, execute atomic receipts, validate delivery dispatches, and audit inventory movements in real time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mb-2" />
              <div className="font-bold text-xs text-foreground">Immutable Ledger</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Audit-grade movement history</div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80">
              <Zap className="w-5 h-5 text-amber-500 mb-2" />
              <div className="font-bold text-xs text-foreground">Instant Offline Sync</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Persistent browser storage</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground z-10 pt-6 border-t border-border">
          <span>Version 2.4.0 (Enterprise)</span>
          <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Zero-Backend Ready
          </div>
        </div>
      </div>

      {/* LOGIN CARD COLUMN */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand */}
          <div className="flex items-center gap-3 lg:hidden justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground shadow-md">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="text-xl font-extrabold tracking-tight gradient-text">StockSense</div>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Welcome to StockSense</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in with your enterprise credentials or use the instant demo account.
            </p>
          </div>

          {/* ONE-CLICK DEMO LOGIN BUTTON */}
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={demoLoading}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all group"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{demoLoading ? 'Signing into Demo...' : 'Instant 1-Click Demo Login'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">or sign in with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="demo@stocksense.app"
                className="mt-1 w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
                <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="mt-1 w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            <button
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
              type="submit"
            >
              {isSubmitting ? 'Verifying...' : 'Sign In to Workspace'}
            </button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Create free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
