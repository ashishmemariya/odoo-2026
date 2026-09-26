import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { axiosClient } from '../../api/axiosClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setError('');
      const res = await axiosClient.post('/auth/login', data);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="p-8 bg-card rounded-lg border shadow-sm max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">StockSense Login</h1>
        
        {error && <div className="mb-4 p-3 bg-destructive/15 text-destructive rounded-md text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input {...register('email')} type="email" className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="demo@stocksense.app" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input {...register('password')} type="password" className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="••••••••" />
          </div>
          <button disabled={isSubmitting} className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium flex items-center justify-center" type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground flex flex-col space-y-2">
          <Link to="/forgot-password" className="hover:text-primary">Forgot Password?</Link>
          <Link to="/signup" className="hover:text-primary">Don't have an account? Sign up</Link>
        </div>
      </div>
    </div>
  );
};
