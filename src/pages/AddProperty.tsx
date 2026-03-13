import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyType, PROPERTY_TYPES, CITIES } from '@/types/property';
import { useTranslation } from 'react-i18next';

import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Building2, MapPin, DollarSign, Ruler, BedDouble, Bath, Info, Loader2, ArrowRight, ShieldCheck, Plus, Camera, Image as ImageIcon, Sparkles, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

export default function AddProperty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const typeParam = searchParams.get('type') as 'sale' | 'rent' | null;

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', price: '', location: '', city: '',
    property_type: 'house' as PropertyType, bedrooms: '0', bathrooms: '0', area: '',
    listing_type: typeParam || 'sale' as 'sale' | 'rent'
  });

  // Keep form in sync with URL params if they change
  useEffect(() => {
    if (typeParam) {
      setForm(prev => ({ ...prev, listing_type: typeParam }));
    }
  }, [typeParam]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Sign-in required', description: 'You must be logged in to list a property.', variant: 'destructive' });
      return;
    }

    if (images.length === 0) {
      toast({ title: 'Missing images', description: 'Please add at least one photo of the property.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      let propertyId: string | null = null;
      let propertyData: any = null;

      const { data: directProperty, error: propertyError } = await supabase
        .from('properties')
        .insert({
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          location: form.location,
          city: form.city,
          property_type: form.property_type as any,
          bedrooms: parseInt(form.bedrooms) || 0,
          bathrooms: parseInt(form.bathrooms) || 0,
          area: parseFloat(form.area) || 0,
          posted_by: user.id,
          status: 'pending',
          listing_type: form.listing_type
        })
        .select()
        .single();

      if (propertyError) {
        const { data: propIdRpc, error: propRpcErr } = await (supabase.rpc as any)('insert_property_rpc', {
          p_title: form.title,
          p_description: form.description,
          p_price: parseFloat(form.price),
          p_location: form.location,
          p_city: form.city,
          p_property_type: form.property_type,
          p_bedrooms: parseInt(form.bedrooms) || 0,
          p_bathrooms: parseInt(form.bathrooms) || 0,
          p_area: parseFloat(form.area) || 0,
          p_posted_by: user.id,
          p_status: 'pending',
          p_listing_type: form.listing_type
        });

        if (propRpcErr) throw propRpcErr;
        propertyId = propIdRpc;
      } else {
        propertyData = directProperty;
        propertyId = directProperty?.id;
      }

      if (!propertyId) throw new Error("Could not initialize property record.");

      const uploadSuccesses = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${propertyId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) continue;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        const { error: imgDbError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            image_url: publicUrl,
            is_primary: i === 0
          });

        if (imgDbError) {
          await (supabase.rpc as any)('insert_property_image_rpc', {
            p_property_id: propertyId,
            p_image_url: publicUrl,
            p_is_primary: i === 0
          });
        }

        uploadSuccesses.push(publicUrl);
      }

      const { error: inqErr } = await supabase.from('inquiries').insert({
        user_id: user.id,
        property_id: propertyId,
        message: `📢 PENDING APPROVAL: "${form.title}" has been submitted and is awaiting admin review.`,
      });

      if (inqErr) {
        await (supabase.rpc as any)('insert_inquiry_rpc', {
          p_user_id: user.id,
          p_property_id: propertyId,
          p_message: `📢 PENDING APPROVAL: "${form.title}" has been submitted and is awaiting admin review.`
        });
      }

      toast({ title: 'Property Submitted for Review', description: 'Your listing has been sent to an admin for approval.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Submission Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="container max-w-5xl py-12 md:py-20">
        <div className="mb-12 animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1">
              {form.listing_type === 'rent' ? 'Rental Division' : 'Ownership Division'}
            </Badge>
            <h1 className="font-display text-5xl font-black tracking-tight mb-3 text-slate-900">
              {form.listing_type === 'rent' ? 'List for' : 'Sell Your'} <span className="text-primary italic">{form.listing_type === 'rent' ? 'Rent' : 'Property'}</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-xl font-medium">
              {form.listing_type === 'rent' ? 'Connect with exclusive tenants seeking architectural distinction.' : 'Reach millions of verified premium buyers in our private marketplace.'}
            </p>
          </div>

          <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
            <button
              type="button"
              onClick={() => update('listing_type', 'sale')}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                form.listing_type === 'sale' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
              )}
            >
              For Sale
            </button>
            <button
              type="button"
              onClick={() => update('listing_type', 'rent')}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                form.listing_type === 'rent' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
              )}
            >
              For Rent
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8 animate-fade-in stagger-1">
            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden rounded-[2.5rem]">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 uppercase tracking-tight">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm"><Info className="h-5 w-5" /></div>
                  Architectural Dossier
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Listing Title</Label>
                  <Input
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    required
                    placeholder="e.g. The Glass Pavilion at Alibaug"
                    className="h-14 rounded-2xl bg-slate-50/50 border-slate-200/60 focus:bg-white focus:ring-primary/10 transition-all text-base font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Property Narrative</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    required
                    rows={8}
                    placeholder="Describe the soul of the space, the light, and the lifestyle it offers..."
                    className="rounded-2xl bg-slate-50/50 border-slate-200/60 focus:bg-white focus:ring-primary/10 transition-all resize-none text-base font-medium leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden rounded-[2.5rem] bg-white">
              <CardHeader className="bg-slate-900 p-8 font-black text-white">
                <CardTitle className="text-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                      <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    Visual Identity
                  </div>
                  <Badge className="bg-white/10 text-white/60 border-none font-black text-[10px] uppercase tracking-widest px-3">Gallery Protocol</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div
                    onClick={triggerCamera}
                    className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer group"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <span className="block font-black text-slate-900 text-[10px] uppercase tracking-widest">Instant Capture</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Mobile Optimized</span>
                    </div>
                  </div>

                  <div
                    onClick={triggerUpload}
                    className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all cursor-pointer group"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center group-hover:-rotate-6 transition-transform">
                      <Upload className="h-8 w-8 text-slate-600" />
                    </div>
                    <div className="text-center">
                      <span className="block font-black text-slate-900 text-[10px] uppercase tracking-widest">Professional Upload</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">High Res Support</span>
                    </div>
                  </div>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImages} />

                {images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Catalogued Assets ({images.length})</h4>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/5" onClick={() => setImages([])}>Discard All</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-[1.5rem] overflow-hidden border-4 border-slate-50 shadow-sm group">
                          <img src={URL.createObjectURL(img)} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="h-10 w-10 rounded-full bg-white text-destructive flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          {i === 0 && <Badge className="absolute top-3 left-3 bg-primary text-white border-none font-black text-[8px] uppercase tracking-widest shadow-lg">Primary Asset</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6 animate-fade-in stagger-2">
            <Card className="border-slate-200/60 shadow-2xl shadow-slate-200/30 sticky top-24 overflow-hidden rounded-[2.5rem]">
              <div className="bg-primary px-8 py-6 flex items-center gap-3 text-white">
                <DollarSign className="h-6 w-6" />
                <span className="font-black uppercase tracking-widest text-sm">Valuation Expert</span>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {form.listing_type === 'rent' ? 'Monthly Lease (₹)' : 'Asking Price (₹)'}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 italic">₹</span>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={e => update('price', e.target.value)}
                      required
                      className="h-14 pl-10 rounded-2xl font-black text-xl bg-slate-50/50 border-slate-200/60 focus:bg-white transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Suites</Label>
                    <div className="relative">
                      <BedDouble className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input type="number" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)} className="h-14 pl-12 rounded-2xl bg-slate-50/50 border-slate-200/60 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Baths</Label>
                    <div className="relative">
                      <Bath className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input type="number" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)} className="h-14 pl-12 rounded-2xl bg-slate-50/50 border-slate-200/60 font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Area (SQFT)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input type="number" value={form.area} onChange={e => update('area', e.target.value)} required className="h-14 pl-12 rounded-2xl bg-slate-50/50 border-slate-200/60 font-bold" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">City Division</Label>
                  <Select value={form.city} onValueChange={v => update('city', v)}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-200/60 font-bold"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Geolocation</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input value={form.location} onChange={e => update('location', e.target.value)} required placeholder="Precise Address" className="h-14 pl-12 rounded-2xl bg-slate-50/50 border-slate-200/60 font-medium" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="flex items-center gap-3 uppercase tracking-widest text-sm">Initialize Listing <ArrowRight className="h-5 w-5" /></span>}
                </Button>

                <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/40">
                  <ShieldCheck className="h-3 w-3" /> Encrypted Submission Protocol
                </div>
              </CardContent>
            </Card>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
}
