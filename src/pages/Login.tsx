import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, ShieldCheck, ArrowRight, User as UserIcon,
  AlertCircle, Eye, EyeOff, Loader2, Info, Sparkles, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Clear any potentially stale session data before attempting new login
    localStorage.removeItem('estatehub_user');

    try {
      const { error: err } = await signIn(email, password, tab);
      if (err) {
        setError(err);
      } else {
        // Use hard redirect to ensure Dashboard state is fully fresh
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = () => {
    if (tab === 'admin') {
      setEmail('sdcreation613@gmail.com');
      setPassword('admin123');
    } else {
      setEmail('demo@user.com');
      setPassword('user123');
    }
    setError('');
  };

  const portalInfo = {
    user: {
      title: "Client Portal",
      desc: "Access your favorites and saved searches",
      color: "from-blue-500 to-cyan-500",
      icon: UserIcon
    },
    admin: {
      title: "Command Center",
      desc: "Platform administration and global oversight",
      color: "from-red-500 to-rose-600",
      icon: ShieldCheck
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 glass-morphism">

        {/* Left Side: Dynamic Portal Info */}
        <div className={cn(
          "hidden lg:flex flex-col justify-between p-12 text-white transition-all duration-700 bg-gradient-to-br",
          portalInfo[tab].color
        )}>
          <div>
            <div className="flex items-center gap-2 mb-8 bg-white/20 w-fit px-4 py-1.5 rounded-full backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest text-white">EstateHub Portal</span>
            </div>

            <div className="space-y-6">
              <div className="h-20 w-20 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                {(() => {
                  const Icon = portalInfo[tab].icon;
                  return <Icon className="h-10 w-10 text-white" />;
                })()}
              </div>
              <h2 className="text-5xl font-black tracking-tighter leading-none">
                {portalInfo[tab].title}
              </h2>
              <p className="text-xl text-white/80 font-medium max-w-md leading-relaxed">
                {portalInfo[tab].desc}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-white/60">© 2026 EstateHub Premium Real Estate</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-12 bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 font-medium">Select your role and sign in to continue.</p>
          </div>

          {/* Role Choice (3 Diff Logins) */}
          <div className="grid grid-cols-3 gap-3 mb-8 p-1.5 bg-slate-100 rounded-[1.5rem]">
            {Object.entries(portalInfo).map(([role, info]) => (
              <button
                key={role}
                type="button"
                onClick={() => { setTab(role as any); setError(''); }}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 rounded-2xl transition-all",
                  tab === role
                    ? "bg-white text-primary shadow-lg scale-[1.02]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                )}
              >
                <info.icon className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{role}</span>
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 relative group">
            <div className="flex items-center gap-3 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-900">{tab} Access Hint</span>
            </div>
            {tab === 'admin' ? (
              <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                <ShieldAlert className="h-3 w-3" />
                <span>Elevated Permission System: Any email will be granted Admin access.</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium">
                Sign in with your verified {tab} credentials to access your personalized dashboard.
              </p>
            )}
            {/* Auto-fill button for testing convenience as requested for "3 diff login" validation */}
            <button
              type="button"
              onClick={fillCredentials}
              className="mt-2 text-[10px] font-black text-primary underline underline-offset-4 hover:text-primary/80 transition-all"
            >
              Fill {tab.toUpperCase()} Credentials →
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-xs font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Email Identity</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="identity@estatehub.com"
                required
                className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-base font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="login-password" className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Secret Key</Label>
                <button type="button" className="text-[10px] font-black text-primary hover:underline underline-offset-4">Forgot Password?</button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all pr-14 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors p-2"
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg mt-4 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">Enter {portalInfo[tab].title} <ArrowRight className="h-5 w-5" /></span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Don't have a {tab} account yet?{' '}
              <Link to="/register" className="text-primary font-black hover:underline underline-offset-4">
                Register as Member
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
