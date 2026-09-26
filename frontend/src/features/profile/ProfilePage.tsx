import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { axiosClient } from '../../api/axiosClient';
import { mockDb } from '../../services/mockDb';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  User,
  Building2,
  Database,
  Lock,
  RotateCcw,
  Download,
  ShieldAlert,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, setAuth, logout, token } = useAuthStore();
  const { data: warehouses } = useWarehouses();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'warehouses' | 'database'>('profile');
  const [profile, setProfile] = useState({
    name: user?.name || 'Alex Harrison',
    email: user?.email || 'demo@stocksense.app',
    company: 'StockSense Global Logistics',
  });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosClient.put('/auth/profile', profile);
      setAuth(res.data.data, token!);
      toast.success('Profile details updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    try {
      await axiosClient.put('/auth/change-password', passwords);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password change failed');
    }
  };

  const handleResetDatabase = () => {
    if (confirm('Are you sure you want to reset all demo data? This restores initial SKUs, warehouses, receipts, and movements.')) {
      mockDb.resetAllData();
      queryClient.invalidateQueries();
      toast.success('Database restored to default demo state!');
    }
  };

  const exportFullJsonBackup = () => {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('stocksense_')) {
        try {
          backup[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
          backup[key] = localStorage.getItem(key);
        }
      }
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `StockSense_FullBackup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    toast.success('System database exported as JSON');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Settings & Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your personal operator credentials, storage facilities, and browser data storage.
        </p>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'profile'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'warehouses'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Warehouse Facilities ({warehouses?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'database'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Local Data Management</span>
        </button>
      </div>

      {/* TAB 1: PROFILE & SECURITY */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* User Card */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-xs flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              {profile.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{profile.name}</div>
              <div className="text-xs text-muted-foreground">{profile.email}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Lead Inventory Architect
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-foreground">Operator Details</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span>Change Security Credentials</span>
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                    placeholder="••••••••"
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-accent text-foreground text-xs font-semibold transition-all"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses?.map((wh: any) => (
              <div key={wh._id} className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                      {wh.code}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="font-bold text-base text-foreground mt-2">{wh.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{wh.address}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-border space-y-2">
                  <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                    Configured Zones ({wh.locations?.length || 0})
                  </div>
                  <div className="space-y-1">
                    {wh.locations?.map((loc: any) => (
                      <div
                        key={loc._id}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-muted/40 font-mono"
                      >
                        <span className="font-semibold text-foreground">{loc.name}</span>
                        <span className="text-[11px] text-muted-foreground">{loc.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOCAL DATA MANAGEMENT */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <span>Zero-Backend In-Browser Storage</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                StockSense is operating in standalone zero-backend mode. All data is persisted directly in your browser's local storage engine with full ACID-like atomic validation logic.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={exportFullJsonBackup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-all shadow-xs"
              >
                <Download className="w-4 h-4 text-primary" />
                <span>Export Full JSON Database Backup</span>
              </button>

              <button
                onClick={handleResetDatabase}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-all shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span>Reset Demo Database to Initial State</span>
              </button>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 space-y-3">
            <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Session Sign Out</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Sign out of your active workspace operator session. Local database will remain preserved for your next session.
            </p>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
