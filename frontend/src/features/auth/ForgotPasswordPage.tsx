import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
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
      toast.success("We've sent a code to your email");
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="p-8 bg-card rounded-lg border shadow-sm max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <button disabled={isLoading} className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium flex items-center justify-center" type="submit">
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground flex flex-col space-y-2">
          <Link to="/reset-password" className="hover:text-primary">Have an OTP? Reset now</Link>
          <Link to="/login" className="hover:text-primary">Back to login</Link>
        </div>
      </div>
    </div>
  );
};
