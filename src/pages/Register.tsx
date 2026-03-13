import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, ArrowRight, User as UserIcon, AlertCircle,
  Eye, EyeOff, Loader2, CheckCircle2, Sparkles, Building, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Identity verification failed: Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await signUp(email, password, fullName.trim(), role);
      if (err) {
        setError(err);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Transmission error during registration.');
    } finally {
      setLoading(false);
    }
  };

  const roleConfigs = {
    user: {
      title: "Private Client",
      subtitle: "Join as a Property Buyer/Renter",
      icon: UserIcon,
      benefits: [
        "Personalized property matching",
        "Direct chat with certified admins",
        "Exclusive early-access listings"
      ],
      color: "from-blue-600 to-indigo-600"
    },
    admin: {
      title: "Platform Admin",
      subtitle: "Join as a System Overseer",
      icon: ShieldCheck,
      benefits: [
        "Full platform security monitor",
        "User role governance",
        "Global listing moderation"
      ],
      color: "from-slate-800 to-slate-900"
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]" />

      <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden relative z-10 scale-[0.98] lg:scale-100 transition-transform">

        {/* Left: Branding & Role Selection */}
        <div className={cn(
          "p-12 text-white flex flex-col justify-between transition-all duration-700 bg-gradient-to-br",
          roleConfigs[role].color
        )}>
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">EstateHub</span>
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                {(() => {
                  const Icon = roleConfigs[role].icon;
                  return <Icon className="h-10 w-10 text-white" />;
                })()}
              </div>
              <div>
                <h2 className="text-5xl font-black tracking-tighter leading-tight mb-4">
                  Register as a <span className="underline decoration-white/30 underline-offset-8">{roleConfigs[role].title}</span>
                </h2>
                <p className="text-xl text-white/70 font-medium">
                  {roleConfigs[role].subtitle}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                {roleConfigs[role].benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5 group hover:bg-white/20 transition-all cursor-default">
                    <CheckCircle2 className="h-6 w-6 text-white shrink-0" />
                    <span className="font-bold text-lg">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm font-bold text-white/50 pt-12 italic">Precision Real Estate Ecosystem v4.0</p>
        </div>

        {/* Right: Registration Form */}
        <div className="p-8 lg:p-16 bg-white overflow-y-auto max-h-[90vh]">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
              <p className="text-slate-500 font-medium">Join our elite community today.</p>
            </div>

            {/* Role Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  role === 'user' ? "bg-white text-primary shadow-md" : "text-slate-400"
                )}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  role === 'admin' ? "bg-white text-primary shadow-md" : "text-slate-400"
                )}
              >
                Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-5 rounded-[2rem] bg-red-50 border border-red-100 flex gap-4 items-center animate-in zoom-in-95 duration-300">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-red-800 font-bold leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Identity Name</Label>
              <Input
                id="reg-name"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setError(''); }}
                placeholder="Johnathan Doe"
                required
                className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Electronic Mail</Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="john@example.com"
                required
                className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Secret</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white pr-14 text-base"
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

            <div className="pt-4 flex flex-col gap-4">
              <Button type="submit" className="w-full h-16 rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.01]" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Processing Identity...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-3">Complete Registration <ArrowRight className="h-6 w-6" /></span>
                )}
              </Button>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                  By joining, you agree to our <span className="text-primary underline">Network Protocols</span> and <span className="text-primary underline">Privacy Shield</span> policies.
                </p>
              </div>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-slate-500">
              Already a verified member?{' '}
              <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">Sign In here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
