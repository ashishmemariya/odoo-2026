import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { axiosClient } from '../../api/axiosClient';

export const ProfilePage = () => {
  const { user, setAuth, logout, token } = useAuthStore();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [status, setStatus] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosClient.put('/auth/profile', profile);
      setAuth(res.data.data, token!);
      setStatus('Profile updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.put('/auth/change-password', passwords);
      setPasswords({ oldPassword: '', newPassword: '' });
      setStatus('Password changed successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Password change failed');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>

      {status && <div className="p-4 bg-green-100 text-green-800 rounded-md text-sm">{status}</div>}

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Personal Information</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} type="text" className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} type="email" className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm" type="submit">
            Save Changes
          </button>
        </form>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Current Password</label>
            <input value={passwords.oldPassword} onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} type="password" required className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">New Password</label>
            <input value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} type="password" required className="mt-1 w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm" type="submit">
            Update Password
          </button>
        </form>
      </div>

      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-destructive">Danger Zone</h2>
        <button onClick={logout} className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-medium text-sm">
          Log Out
        </button>
      </div>
    </div>
  );
};
