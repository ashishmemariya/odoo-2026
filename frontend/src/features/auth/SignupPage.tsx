import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { axiosClient } from '../../api/axiosClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const SignupPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    try {
      setError('');
      const res = await axiosClient.post('/auth/signup', { name: data.name, email: data.email, password: data.password });
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="p-8 bg-card rounded-lg border shadow-sm max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        
        {error && <div className="mb-4 p-3 bg-destructive/15 text-destructive rounded-md text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input {...register('name')} type="text" className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input {...register('email')} type="email" className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input {...register('password')} type="password" className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <input {...register('confirmPassword')} type="password" className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button disabled={isSubmitting} className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium" type="submit">
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="hover:text-primary">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  );
};
