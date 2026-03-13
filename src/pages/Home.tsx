import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Property, PROPERTY_TYPES, CITIES } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Building2, Users, ShieldCheck, ArrowRight,
  MapPin, Sparkles, Building, Key, Star, Quote, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Property[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('buy');

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_images(*)')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching featured properties:', error);
        return;
      }

      if (data) {
        // Manually fetch profiles to resolve "Listed by" names
        const userIds = Array.from(new Set(data.map((p: any) => p.posted_by)));
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          const pMap = Object.fromEntries(profiles?.map(p => [p.user_id, p.full_name]) || []);
          data.forEach((p: any) => {
            p.profiles = { full_name: pMap[p.posted_by] || 'EstateHub Host' };
          });
        }
        setFeatured(data as any);
      }
    };

    fetchFeaturedProperties();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/properties');
    }
  };

  return (
    <div className="min-h-screen bg-white font-lato">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden py-20 bg-slate-950">
        <div className="absolute inset-0 z-0 opacity-60">
          <img
            src="https://images.unsplash.com/photo-1628592102751-ba83b0314276?auto=format&fit=crop&q=80&w=2400"
            alt="Luxury Penthouse"
            className="h-full w-full object-cover animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-8 backdrop-blur-md animate-fade-in shadow-2xl">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Premium Real Estate Hub v4.0</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-8 animate-fade-in stagger-1">
              {t('home.hero_title').split(' ').slice(0, 2).join(' ')} <br />
              <span className="text-primary italic">{t('home.hero_title').split(' ')[2]}</span> <br />
              {t('home.hero_title').split(' ').slice(3).join(' ')}
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-xl mb-12 animate-fade-in stagger-2 leading-relaxed">
              {t('home.hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Stats Section ─────────────────────────────────────── */}
      <section className="py-20 bg-slate-950 border-y border-white/5 relative z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" />
        <div className="container relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: t('home.stats.market_volume'), value: '$4.2B+', icon: Building, desc: 'Total asset value under management across premium locations worldwide.' },
              { label: t('home.stats.private_clients'), value: '12K+', icon: Users, desc: 'High-net-worth individuals trusting EstateHub for their luxury portfolio.' },
              { label: t('home.stats.avg_appreciation'), value: '14.2%', icon: Sparkles, desc: 'Consistent year-over-year property value growth and ROI generation.' },
            ].map((s, index) => (
              <div
                key={s.label}
                className="group relative flex flex-col p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
                <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all duration-500" />

                <div className="relative z-10">
                  <div className="h-16 w-16 mb-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:-rotate-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                    <s.icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">{s.value}</p>
                    <p className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-primary group-hover:text-primary/80 transition-colors">{s.label}</p>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[250px] pt-4 border-t border-white/10 group-hover:text-slate-300 transition-colors">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Experience Section ────────────────────────────────── */}
      <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] bg-primary/5 rounded-full blur-[120px]" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative animate-fade-in">
              <div className="relative aspect-square rounded-[3.5rem] overflow-hidden border-8 border-white/5 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              </div>

              {/* Floating Badges */}
              <div className="absolute -top-10 -right-10 bg-white p-8 rounded-[2.5rem] shadow-2xl animate-float">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Star className="h-7 w-7 fill-primary" /></div>
                  <div>
                    <p className="text-slate-900 font-black text-2xl">4.9/5.0</p>
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Client Satisfaction</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Key className="h-7 w-7" /></div>
                  <div>
                    <p className="text-white font-black text-2xl">Verified</p>
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Ownership Guaranteed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12 animate-fade-in">
              <div>
                <Badge className="bg-white/10 text-white border-none font-black text-[9px] uppercase tracking-[0.3em] px-4 h-6 mb-6">{t('home.experience.lifestyle')}</Badge>
                <h2 className="text-6xl font-black leading-tight tracking-tighter mb-6">
                  {t('home.experience.redefining').split(' ').slice(0, 1).join(' ')} <br />
                  {t('home.experience.redefining').split(' ').slice(1, 3).join(' ')} <br />
                  <span className="text-primary italic">{t('home.experience.redefining').split(' ').slice(3).join(' ')}</span>
                </h2>
                <p className="text-slate-400 text-xl font-medium leading-relaxed">
                  {t('home.experience.subtitle')}
                </p>
              </div>

              <div className="grid gap-8">
                {[
                  { title: t('home.experience.features.ai_matching'), desc: t('home.experience.features.ai_desc'), icon: Sparkles },
                  { title: t('home.experience.features.verification'), desc: t('home.experience.features.verification_desc'), icon: ShieldCheck },
                  { title: t('home.experience.features.concierge'), desc: t('home.experience.features.concierge_desc'), icon: Users }
                ].map((f, i) => (
                  <div key={f.title} className="flex gap-6 group">
                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black mb-1">{f.title}</h3>
                      <p className="text-slate-500 font-medium">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────── */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container">
          <div className="text-center mb-20 animate-fade-in">
            <Quote className="h-16 w-16 text-primary/20 mx-auto mb-6" />
            <h2 className="text-5xl font-black tracking-tight text-slate-900">
              {t('home.testimonials.title').split(' ').slice(0, 2).join(' ')} <span className="text-primary italic">{t('home.testimonials.title').split(' ').slice(2).join(' ')}</span>
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 justify-between">
            {(t('home.testimonials.items', { returnObjects: true }) as any[]).map((testimonial, i) => {
              const names = ['Aditya Khanna', 'Sarah Menezes', 'Vikram Singh'];
              return (
                <div key={names[i]} className="flex-1 p-10 rounded-[3rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 group animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex gap-1 mb-6 text-primary transition-transform duration-500 group-hover:scale-110 origin-left">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className="h-4 w-4 fill-primary" />)}
                  </div>
                  <p className="text-lg font-medium text-slate-700 italic mb-8 leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl transition-colors duration-500 group-hover:bg-primary group-hover:text-white">
                      {names[i].charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-primary transition-colors duration-300">{names[i]}</p>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>




      <Footer />
    </div>
  );
} 