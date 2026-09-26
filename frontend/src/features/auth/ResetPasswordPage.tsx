import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ 
    email: searchParams.get('email') || '', 
    otp: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      setError('');
      await axiosClient.post('/auth/reset-password', formData);
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="p-8 bg-card rounded-lg border shadow-sm max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Enter New Password</h1>
        
        {error && <div className="mb-4 p-3 bg-destructive/15 text-destructive rounded-md text-sm">{error}</div>}
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" required className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">OTP</label>
            <input value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} type="text" required className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">New Password</label>
            <input value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} type="password" required minLength={6} className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <input value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} type="password" required minLength={6} className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <button className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium" type="submit">
            Reset Password
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="hover:text-primary">Back to login</Link>
        </div>
      </div>
    </div>
  );
};
