import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Boxes, Lock, KeyRound, Mail, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || 'demo@stocksense.app',
    otp: searchParams.get('otp') || '123456',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setIsLoading(true);
    try {
      setError('');
      await axiosClient.post('/auth/reset-password', formData);
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3 justify-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground shadow-md">
            <Boxes className="w-5 h-5" />
          </div>
          <div className="text-xl font-extrabold tracking-tight gradient-text">StockSense</div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Set New Password</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter the verification code and your new security credentials.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              type="email"
              required
              className="mt-1 w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Verification OTP
            </label>
            <input
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              type="text"
              required
              placeholder="123456"
              className="mt-1 w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> New Password
            </label>
            <input
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="mt-1 w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Confirm New Password
            </label>
            <input
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="mt-1 w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <button
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
            type="submit"
          >
            {isLoading ? 'Resetting...' : 'Save New Password'}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          <Link to="/login" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
