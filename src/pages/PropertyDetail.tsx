import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Property } from '@/types/property';

import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Bed, Bath, Maximize, User, Heart,
  Send, Share2, ChevronLeft, Calendar,
  ShieldCheck, Check, Info, Loader2, ArrowRight, Clock,
  Settings, Edit3, Trash2, Tag, Building2, Printer, Sparkles, CheckCircle, ArrowRightLeft, History as HistoryIcon, ShieldCheck as ShieldCheckIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [sending, setSending] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [successInquiry, setSuccessInquiry] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      const { data } = await supabase
        .from('properties')
        .select('*, property_images(*)')
        .eq('id', id)
        .single();

      if (data) {
        // Manually fetch the profile of the property owner
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, bio')
          .eq('user_id', data.posted_by)
          .maybeSingle();
        (data as any).profiles = profileData || null;
      }

      setProperty(data);
      setLoading(false);

      if (user) {
        // Use Ultra RPC for favorites
        (supabase.rpc as any)('get_user_favorites_ultra_rpc', { p_user_id: user.id })
          .then(({ data }: any) => {
            const favs = (data || []).map((f: any) => f.property_id);
            setIsFav(favs.includes(id));
          });

        // Fetch success inquiry for this property (if sold) via deep recovery RPC
        try {
          const { data: inq } = await (supabase.rpc as any)('get_property_success_inquiry_rpc', { p_property_id: id });
          if (inq) {
            setSuccessInquiry(inq);
          }
        } catch (e) {
          console.warn("[PropertyDetail] Success inquiry fetch failed:", e);
        }
      }
    };
    fetchProperty();
  }, [id, user]);

  const toggleFav = async () => {
    if (!user || !id) {
      toast({ title: "Sign in required", description: "Login to save your favorites." });
      return;
    }

    const wasFav = isFav;
    setIsFav(!wasFav);

    const { error } = await (supabase.rpc as any)('toggle_favorite_rpc', {
      p_user_id: user.id,
      p_property_id: id
    });

    if (error) {
      console.error('[Favorites] RPC failed:', error);
      setIsFav(wasFav); // Revert on failure
      toast({ title: "Update Failed", description: "Could not save favorite status.", variant: "destructive" });
    }
  };

  // Helper: always get a server-validated real user ID
  const getRealUserId = async (): Promise<string | null> => {
    if (user?.id) return user.id;

    // Fallback if context is somehow empty but session exists
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser?.id) return authUser.id;

    return null;
  };

  const sendInquiry = async (customMessage?: string) => {
    const finalMessage = customMessage || message.trim();
    if (!finalMessage) return;

    const realUserId = await getRealUserId();
    if (!realUserId) {
      toast({ title: 'Session expired', description: 'Please sign out and sign in again.', variant: 'destructive' });
      return;
    }

    setSending(true);
    const prefix = inquiryType === 'purchase' || customMessage?.includes('PURCHASE REQUEST') ? '🛑 PURCHASE REQUEST 🛑 ' :
      inquiryType === 'tour' ? '📅 TOUR REQUEST: ' : '';
    const finalMsg = `${prefix}${finalMessage}`;

    // Try direct insert first
    let { error } = await supabase.from('inquiries').insert({
      user_id: realUserId,
      property_id: id,
      message: finalMsg,
    });

    // If RLS blocks it, use the SECURITY DEFINER RPC as fallback
    if (error) {
      console.warn('[Inquiry] Direct insert blocked, trying RPC fallback:', error.message);
      const { error: rpcError } = await (supabase.rpc as any)('insert_inquiry_rpc', {
        p_user_id: realUserId,
        p_property_id: id,
        p_message: finalMsg,
      });
      error = rpcError;
    }

    setSending(false);
    if (!error) {
      toast({
        title: inquiryType === 'purchase' ? 'Purchase Request Sent!' : 'Message Sent!',
        description: inquiryType === 'purchase' ? 'The owner has been notified of your intent to buy.' : 'The property admin will contact you shortly.'
      });
      setMessage('');
    } else {
      console.error('[Inquiry] Final error:', error);
      toast({ title: 'Failed to send', description: 'Our systems are temporarily busy. Please try again in a moment.', variant: 'destructive' });
    }
  };

  const sendPurchaseRequest = async () => {
    if (!property) return;

    const realUserId = await getRealUserId();
    if (!realUserId) {
      toast({ title: 'Session expired', description: 'Please sign out and sign in again to make a purchase request.', variant: 'destructive' });
      return;
    }

    setSending(true);
    const msg = `🛑 PURCHASE REQUEST 🛑 I am ready to purchase "${property.title}" for ${formatCurrency(property.price)}. Please initiate the transaction process.`;

    // Try direct insert first
    let { error } = await supabase.from('inquiries').insert({
      user_id: realUserId,
      property_id: id,
      message: msg,
    });

    // If RLS blocks it, use the SECURITY DEFINER RPC as fallback
    if (error) {
      console.warn('[Purchase] Direct insert blocked, trying RPC fallback:', error.message);
      const { error: rpcError } = await (supabase.rpc as any)('insert_inquiry_rpc', {
        p_user_id: realUserId,
        p_property_id: id,
        p_message: msg,
      });
      error = rpcError;
    }

    setSending(false);
    if (!error) {
      toast({
        title: '🎉 Purchase Request Sent!',
        description: 'The property owner has been notified. They will contact you shortly.',
      });
    } else {
      console.error('[Purchase] Final error:', error);
      toast({ title: 'Could not send request', description: 'Our systems are temporarily busy. Please try again in a moment.', variant: 'destructive' });
    }
  };

  const markPropertySold = async () => {
    if (!confirm('Mark this property as sold? This will officially finalize the transaction.')) return;

    setSending(true);
    try {
      // 1. Update property status
      let { error: propErr } = await supabase.from('properties').update({ status: 'sold' as any }).eq('id', id as string);

      if (propErr) {
        await (supabase.rpc as any)('update_property_status_rpc', { p_property_id: id, p_status: 'sold' });
      }

      // 2. SMART RECOVERY: Try to find the most recent purchase request to "Auto-Approve" 
      // This solves the "still awaiting" issue for buyers when seller marks as sold manually.
      const { data: purchaseReqs } = await supabase
        .from('inquiries')
        .select('id')
        .eq('property_id', id)
        .ilike('message', '%🛑 PURCHASE REQUEST 🛑%')
        .order('created_at', { ascending: false })
        .limit(1);

      if (purchaseReqs && purchaseReqs.length > 0) {
        console.log("[PropertyDetail] Auto-approving the most recent purchase request for manual sale...");
        await (supabase.rpc as any)('update_inquiry_status_rpc', {
          p_inquiry_id: purchaseReqs[0].id,
          p_status: 'approved'
        });
      }

      setProperty((prev: any) => ({ ...prev, status: 'sold' }));
      toast({ title: 'Property Sold!', description: 'The transaction has been finalized and buyers notified.' });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const deleteProperty = async () => {
    if (!confirm('Permanently delete this listing? This cannot be undone.')) return;
    await supabase.from('properties').delete().eq('id', id as string);
    toast({ title: 'Listing Deleted' });
    window.history.back();
  };

  if (loading) return <div className="min-h-screen bg-background flex flex-col"><div className="flex-1 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></div>;
  if (!property) return <div className="min-h-screen bg-background flex flex-col"><div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8"><h1 className="text-3xl font-bold">Listing Not Found</h1><Link to="/properties"><Button variant="outline">Back to Marketplace</Button></Link></div></div>;

  const images = property.property_images || [];
  const isOwner = user?.id === property?.posted_by;

  return (
    <div className="min-h-screen bg-background/50">


      <main className="container py-8 md:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <Link to="/properties">
            <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back to listings
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl border border-border/50"><Share2 className="h-4 w-4" /></Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFav}
              className={`rounded-xl border border-border/50 transition-colors ${isFav ? 'text-destructive bg-destructive/5' : ''}`}
            >
              <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Visual Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* High-End Gallery */}
            <section className="space-y-4 animate-scale-in">
              <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl bg-muted aspect-video border border-border/50">
                <img
                  src={images[selectedImage]?.image_url || '/placeholder.svg'}
                  alt={property.title}
                  className={cn(
                    "h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]",
                    property.status === 'sold' && "grayscale-[0.5] brightness-[0.7]"
                  )}
                />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <Badge className="bg-primary/90 text-primary-foreground text-xs uppercase font-black px-4 py-1 tracking-widest border-none backdrop-blur-md w-fit">
                    {property.property_type}
                  </Badge>
                  {property.status === 'sold' && (
                    <div className="absolute inset-0 z-10">
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Badge className="bg-red-600 text-white text-3xl font-black px-12 py-4 tracking-[0.4em] border-4 border-white/20 shadow-[0_0_80px_rgba(220,38,38,0.6)] skew-x-[-15deg] rotate-[-5deg] uppercase h-auto">
                          Sold
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar">
                  {images.map((img: any, i: number) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(i)}
                      className={`relative shrink-0 w-28 aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-primary shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Content & Specs */}
            <div className="space-y-8 animate-fade-in stagger-1">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-2">{property.title}</h1>
                  <p className="flex items-center gap-2 text-muted-foreground text-lg">
                    <MapPin className="h-5 w-5 text-primary" /> {property.location}, {property.city}
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <div className="font-display text-4xl font-black text-primary drop-shadow-sm">{formatCurrency(property.price)}</div>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary font-bold uppercase tracking-wider text-xs flex items-center gap-1 mt-2 hover:no-underline opacity-80 hover:opacity-100"
                    onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Contact Admin <ArrowRight className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center md:justify-end gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-2">
                    <Calendar className="h-3 w-3" /> Published on {new Date(property.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Luxury Spec Bar */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-8 rounded-[2rem] border border-border/40 bg-card/30 backdrop-blur-xl shadow-inner">
                {[
                  { icon: Bed, label: 'Bedrooms', value: property.bedrooms, hide: property.property_type === 'land' },
                  { icon: Bath, label: 'Bathrooms', value: property.bathrooms, hide: property.property_type === 'land' },
                  { icon: Maximize, label: 'Square Area', value: `${property.area} sqft`, hide: false }
                ].map((spec, i) => !spec.hide && (
                  <div key={i} className="flex flex-col gap-1">
                    <spec.icon className="h-6 w-6 text-primary mb-2" />
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{spec.label}</div>
                    <div className="text-xl font-black text-foreground">{spec.value}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> About this Property
                </h2>
                <div className="prose prose-neutral max-w-none text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                  {property.description}
                </div>
              </div>

              {/* Amenities placeholder (for extra premium feel) */}
              <div className="pt-8 border-t border-border/40">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Premium Inclusions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['High Security', 'Prime Location', 'Verified Admin', 'Smart Living'].map(a => (
                    <div key={a} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-xs font-bold text-muted-foreground">
                      <Check className="h-4 w-4 text-success" /> {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Inquiry Card */}
          <aside className="space-y-6 animate-fade-in stagger-2">
            {/* Admin Highlight */}
            <Card className="rounded-[2rem] border-border/40 shadow-xl overflow-hidden group">
              <div className="h-16 bg-primary group-hover:bg-primary/90 transition-colors" />
              <CardContent className="-mt-8 pb-8">
                <div className="flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-full border-4 border-background bg-secondary flex items-center justify-center overflow-hidden mb-4 shadow-lg group-hover:scale-105 transition-transform duration-500">
                    {property.profiles?.avatar_url ? (
                      <img src={property.profiles.avatar_url} className="h-full w-full object-cover" />
                    ) : <User className="h-10 w-10 text-muted-foreground/40" />}
                  </div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Asset Owner</div>
                  <h3 className="font-display text-2xl font-black text-slate-900 leading-tight">{property.profiles?.full_name || 'Premium Host'}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase mt-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                    <ShieldCheck className="h-3 w-3" /> Verified Partner
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 px-4 leading-relaxed">
                    {property.profiles?.bio || "Expert in high-value residents and luxury property acquisition across the region."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Buy / Owner Management Section */}
            {isOwner ? (
              /* OWNER PANEL */
              <Card className="rounded-[2rem] border-2 border-amber-200 shadow-xl overflow-hidden bg-amber-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-amber-600 font-black uppercase tracking-widest text-[10px] mb-2">
                    <Settings className="h-3 w-3 animate-spin-slow" /> YOUR LISTING
                  </div>
                  <CardTitle className="text-xl text-slate-900">Owner Control Panel</CardTitle>
                  <p className="text-slate-500 text-sm font-medium">Manage your property listing below.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price summary */}
                  <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">Listed Price</span>
                      <span className="font-black text-primary text-lg">{formatCurrency(property.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">Status</span>
                      <span className={`font-black uppercase text-xs px-3 py-1 rounded-full ${property.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                        : property.status === 'sold' ? 'bg-slate-200 text-slate-600'
                          : 'bg-amber-100 text-amber-700'
                        }`}>{property.status || 'Pending'}</span>
                    </div>
                  </div>

                  {/* Owner Actions */}
                  <div className="space-y-3">
                    <Link to={`/add-property`} className="block">
                      <Button variant="outline" className="w-full h-12 rounded-2xl border-2 border-slate-200 font-bold flex items-center gap-2 hover:bg-slate-100">
                        <Edit3 className="h-4 w-4" /> Edit Listing
                      </Button>
                    </Link>
                    {property.status !== 'sold' && (
                      <Button
                        className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-2 shadow-lg shadow-emerald-100"
                        onClick={markPropertySold}
                      >
                        <Tag className="h-4 w-4" /> Mark as Sold
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-2 border-red-100 text-red-600 font-bold flex items-center gap-2 hover:bg-red-50"
                      onClick={deleteProperty}
                    >
                      <Trash2 className="h-4 w-4" /> Delete Listing
                    </Button>
                  </div>

                  <p className="text-[9px] text-center text-slate-400 font-bold px-4 pt-1">
                    You are the owner of this property. Buyers can send purchase requests via the inquiry form.
                  </p>
                </CardContent>
              </Card>
            ) : (
              /* BUYER PURCHASE PANEL */
              <Card className="rounded-[2rem] border-border/40 shadow-xl overflow-hidden bg-white border-2 border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] mb-2">
                    <ShieldCheck className="h-3 w-3" /> SECURE TRANSACTION
                  </div>
                  <CardTitle className="text-xl">Direct Purchase Option</CardTitle>
                  <p className="text-muted-foreground text-sm font-medium">Acquire this asset with full verification.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-semibold">Asset Value</span>
                      <span className="font-bold text-foreground">{formatCurrency(property.price)}</span>
                    </div>
                    <div className="pt-2 border-t border-primary/20 flex justify-between">
                      <span className="font-black text-xs uppercase tracking-widest self-center">Total Price</span>
                      <span className="text-lg font-black text-primary">{formatCurrency(property.price)}</span>
                    </div>
                  </div>

                  {property.status === 'sold' ? (
                    <div className="w-full h-14 rounded-2xl bg-slate-200 text-slate-500 font-black text-sm flex items-center justify-center gap-2">
                      <Building2 className="h-5 w-5" /> This Property Has Been Sold
                    </div>
                  ) : property.status === 'pending' || !property.status ? (
                    <div className="w-full p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex flex-col items-center gap-2 text-center">
                      <Clock className="h-6 w-6 animate-pulse" />
                      <div>
                        <p className="font-black text-sm uppercase tracking-widest">Awaiting Verification</p>
                        <p className="text-[10px] font-bold opacity-80 mt-1">This asset is currently being audited by our admin team before it can be acquired.</p>
                      </div>
                    </div>
                  ) : user ? (
                    <Button
                      className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-black/10 transition-all hover:scale-[1.02] group"
                      onClick={sendPurchaseRequest}
                      disabled={sending}
                    >
                      {sending
                        ? <Loader2 className="animate-spin h-5 w-5" />
                        : <span className="flex items-center gap-2">Buy Now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></span>
                      }
                    </Button>
                  ) : (
                    <Link to="/login" className="block">
                      <Button variant="outline" className="w-full h-12 rounded-xl border-primary text-primary hover:bg-primary/10">Sign In to Purchase</Button>
                    </Link>
                  )}

                  {/* CERTIFICATE BUTTON FOR AUTHORIZED PARTIES (Case-Insensitive) */}
                  {property.status === 'sold' && successInquiry && (
                    (() => {
                      const curName = (user?.fullName || '').toLowerCase();
                      const bName = (successInquiry.buyer_name || '').toLowerCase();
                      const sName = (successInquiry.seller_name || '').toLowerCase();
                      const isAuth = user?.id === successInquiry.user_id ||
                        (curName && bName && curName === bName) ||
                        user?.id === property.posted_by ||
                        (curName && sName && curName === sName);

                      return isAuth && (
                        <div className="pt-4 border-t border-primary/10 mt-6 space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            <ShieldCheckIcon className="h-4 w-4" /> Transaction Identity Verified
                          </div>
                          <Button
                            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 animate-pulse-slow"
                            onClick={() => setShowCertificate(true)}
                          >
                            <Printer className="h-5 w-5" /> View Digital Deed
                          </Button>
                        </div>
                      );
                    })()
                  )}

                  <p className="text-[9px] text-center text-muted-foreground font-bold px-4">
                    By clicking, a purchase request is sent directly to the property owner. They will contact you to complete the transaction.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Inquiry Form */}
            <Card id="inquiry-form" className="rounded-[2rem] border-border/40 shadow-xl bg-primary text-primary-foreground overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Request Exclusive View</CardTitle>
                <p className="text-primary-foreground/70 text-sm">Our admins typically respond within 12 hours.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60 ml-1">Inquiry Purpose</label>
                      <Select value={inquiryType} onValueChange={setInquiryType}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-xl h-12">
                          <SelectValue placeholder="Select Purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="tour">Schedule Private Tour</SelectItem>
                          <SelectItem value="purchase">Purchase Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Textarea
                      placeholder="e.g. I would like to schedule a private tour this weekend..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-2xl h-32 resize-none focus:bg-white/20 transition-all font-medium"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                    <Button
                      className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black text-lg shadow-xl shadow-black/20"
                      onClick={() => sendInquiry()}
                      disabled={sending || !message.trim()}
                    >
                      {sending ? <Loader2 className="animate-spin h-5 w-5" /> : <span className="flex items-center gap-2">Send Inquiry <Send className="h-4 w-4" /></span>}
                    </Button>
                  </>
                ) : (
                  <div className="py-8 text-center bg-black/10 rounded-[1.5rem] border border-white/10">
                    <p className="text-sm font-bold mb-4">You must be logged in to send an inquiry.</p>
                    <Link to="/login">
                      <Button variant="outline" className="h-10 rounded-xl border-white/40 text-white hover:bg-white/10">Sign In Now</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* LUXURY OWNERSHIP CERTIFICATE MODAL */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-4xl p-0 bg-white border-none shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden rounded-[2.5rem] print:shadow-none print:rounded-none">
          <div id="certificate-content" className="relative p-1 bg-gradient-to-br from-[#fdfbf7] via-[#fcf9f2] to-[#f9f5e8] print:bg-white min-h-[750px] overflow-hidden">

            {/* Elegant Background Patterns */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

            {/* Multi-layered Borders */}
            <div className="absolute inset-6 border-[16px] border-[#b8860b]/5 rounded-sm pointer-events-none" />
            <div className="absolute inset-10 border-[2px] border-[#b8860b]/20 rounded-sm pointer-events-none" />
            <div className="absolute inset-12 border-[1px] border-[#b8860b]/10 rounded-sm pointer-events-none" />

            {/* Ornamental Corners */}
            {[
              "top-8 left-8 border-t-4 border-l-4",
              "top-8 right-8 border-t-4 border-r-4",
              "bottom-8 left-8 border-b-4 border-l-4",
              "bottom-8 right-8 border-b-4 border-r-4"
            ].map((pos, idx) => (
              <div key={idx} className={`absolute h-16 w-16 border-[#b8860b]/40 ${pos} pointer-events-none`} />
            ))}

            <div className="relative z-10 px-24 py-20 space-y-12">

              {/* Header section with Reg details */}
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b8860b]">Digital Registry No</span>
                    <span className="text-sm font-black text-slate-900 font-mono">CPH-{(successInquiry?.id || 'ALPHA').slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b8860b]">Jurisdiction</span>
                    <span className="text-xs font-bold text-slate-600 uppercase">EstateHub National Registry</span>
                  </div>
                </div>

                <div className="text-center flex flex-col items-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative h-16 w-16 bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex items-center justify-center rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] mb-3 transform -rotate-3 group-hover:rotate-0 transition-transform">
                      <Building2 className="w-9 h-9 text-primary animate-pulse-slow" />
                    </div>
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#1e293b] drop-shadow-sm">Crown Asset Registry</h4>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b8860b]">Verification Status</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                      <ShieldCheckIcon className="h-3 w-3" /> Ledger Settled
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b8860b]">Issue Date</span>
                    <span className="text-xs font-bold text-slate-800">{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center relative py-4">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none">
                  <ShieldCheckIcon className="h-64 w-64" />
                </div>
                <h1 className="text-6xl font-serif text-[#1e293b] italic leading-tight">
                  Certificate of <span className="text-primary not-italic font-black block text-7xl tracking-tighter mt-2">Title Deed</span>
                </h1>
                <div className="h-1 w-32 bg-primary mx-auto mt-6 rounded-full shadow-[0_2px_10px_rgba(234,179,8,0.3)]" />
              </div>

              {/* Grantee Section */}
              <div className="text-center space-y-8 relative z-10">
                <p className="text-lg font-serif text-slate-600 italic">This document certifies that the absolute ownership of the property listed below is hereby vested in</p>
                <div className="relative inline-block">
                  <h3 className="text-5xl font-black text-[#1e293b] tracking-tighter uppercase relative z-10 px-12 py-4">
                    {successInquiry?.buyer_name || 'Verified Acquisition Member'}
                  </h3>
                  <div className="absolute inset-0 bg-primary/5 skew-x-[-15deg] rounded-lg -z-10" />
                  <div className="absolute bottom-2 left-0 right-0 h-1 bg-primary/40 rounded-full" />
                </div>
              </div>

              {/* Asset Details Grid */}
              <div className="grid grid-cols-2 gap-12 bg-white/40 p-10 rounded-[2rem] border border-[#b8860b]/10 shadow-[inner_0_2px_20px_rgba(0,0,0,0.02)] relative">

                {/* OFFICIAL SOLD STAMP */}
                <div className="absolute -top-10 -right-4 z-20 pointer-events-none select-none transform rotate-[-12deg] animate-scale-in">
                  <div className="border-[6px] border-red-600/60 rounded-2xl px-8 py-3 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[1px] shadow-xl">
                    <span className="text-red-600/80 text-4xl font-black uppercase tracking-[0.3em] leading-none mb-1">Sold</span>
                    <span className="text-red-600/60 text-[10px] font-black uppercase tracking-widest pt-1 border-t border-red-600/20">Official Transfer</span>
                    <div className="absolute inset-0 border-2 border-red-600/20 m-1 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-1 border-l-4 border-primary pl-4 py-1">
                    <span className="text-[10px] font-black uppercase text-[#b8860b] tracking-widest">Asset Identification</span>
                    <span className="text-base font-black text-[#1e293b]">{property?.title}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l-4 border-slate-300 pl-4 py-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Property Location</span>
                    <span className="text-sm font-bold text-[#1e293b] italic">{property?.location}, {property?.city}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l-4 border-slate-300 pl-4 py-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Previous Registrant</span>
                    <span className="text-sm font-bold text-slate-600">{successInquiry?.seller_name}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-1 border-r-4 border-emerald-500 pr-4 py-1 text-right">
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Settlement Value</span>
                    <span className="text-2xl font-black text-[#1e293b]">{formatCurrency(property?.price || 0)}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-r-4 border-slate-300 pr-4 py-1 text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transfer Settlement date</span>
                    <span className="text-sm font-bold text-[#1e293b] uppercase tracking-tighter">
                      {new Date(successInquiry?.created_at).toLocaleDateString(undefined, { dateStyle: 'full' })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 border-r-4 border-slate-300 pr-4 py-1 text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Certified Area</span>
                    <span className="text-sm font-bold text-[#1e293b]">{property?.area} SQFT <span className="text-[10px] opacity-40">(Verified)</span></span>
                  </div>
                </div>
              </div>

              {/* Signatures & Seals */}
              <div className="flex justify-between items-end pt-8 relative">
                <div className="text-center group">
                  <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-3" />
                  <p className="text-[10px] font-black uppercase text-[#b8860b] tracking-widest italic animate-pulse-slow">Secure Digital Seal</p>
                  <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">ESTATEHUB AUTHENTICATION</p>
                </div>

                <div className="relative group flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse-slow" />
                  <div className="h-32 w-32 rounded-full border-[10px] border-double border-primary/30 flex items-center justify-center relative bg-white/20 backdrop-blur-sm shadow-xl transform group-hover:scale-110 transition-transform duration-700">
                    <ShieldCheckIcon className="h-16 w-16 text-primary group-hover:rotate-12 transition-transform" />
                    <div className="absolute -inset-2 border-2 border-dashed border-primary/10 rounded-full animate-spin-slow" />
                  </div>
                </div>

                <div className="text-center">
                  <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-3" />
                  <p className="text-sm font-serif italic text-slate-900 font-bold tracking-tight">System Registrar</p>
                  <p className="text-[8px] font-black uppercase text-[#b8860b] mt-1 tracking-widest leading-relaxed">Verified Electronic Signature</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-10 flex gap-6 print:hidden">
                <Button
                  className="flex-1 h-14 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white font-black text-lg hover:bg-slate-800 hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-3 group"
                  onClick={() => window.print()}
                >
                  <Printer className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  Download Certificate
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                  onClick={() => setShowCertificate(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
