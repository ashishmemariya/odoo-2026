import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Boxes, Mail, ArrowLeft, KeyRound } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('demo@stocksense.app');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      await axiosClient.post('/auth/forgot-password', { email });
      toast.success("Verification code simulated! You can use '123456'.");
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=123456`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request failed');
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
          <h1 className="text-2xl font-black tracking-tight text-foreground">Password Recovery</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your account email to receive an instant verification code.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Registered Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-1 w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <button
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
            type="submit"
          >
            {isLoading ? 'Generating OTP...' : 'Send Recovery Code'}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <Link to="/reset-password" className="text-primary font-bold hover:underline flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5" /> Have an OTP?
          </Link>
          <Link to="/login" className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
