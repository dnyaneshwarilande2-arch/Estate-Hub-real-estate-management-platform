import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PropertyCard } from '@/components/PropertyCard';
import { Property, ListingType, CITIES, PROPERTY_TYPES } from '@/types/property';
import { Search, Building2, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PROPERTIES_PER_PAGE = 9;

export default function Properties() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as ListingType | null;

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState<ListingType | 'all'>(typeParam || 'all');
  const [city, setCity] = useState('all');
  const [type, setType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('any');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Update listingType when URL param changes
  useEffect(() => {
    if (typeParam) {
      setListingType(typeParam);
    }
  }, [typeParam]);

  useEffect(() => {
    fetchProperties(true);
  }, [search, listingType, city, type, minPrice, maxPrice, bedrooms, sortBy]);

  useEffect(() => {
    if (user) {
      // Use Ultra RPC to fetch favorites bypassing RLS issues
      (supabase.rpc as any)('get_user_favorites_ultra_rpc', { p_user_id: user.id })
        .then(({ data, error }: any) => {
          if (error) {
            console.warn('[Properties] Ultra Favorites RPC failed, falling back to direct select:', error);
            return supabase.from('favorites').select('property_id').eq('user_id', user.id);
          }
          return { data: (data || []).map((f: any) => ({ property_id: f.property_id })) };
        })
        .then(({ data }: any) => {
          if (data) setFavorites(new Set(data.map((f: any) => f.property_id)));
        });
    }
  }, [user]);

  const fetchProperties = async (reset = false) => {
    setLoading(true);
    let query: any = supabase.from('properties').select('*, property_images(*)', { count: 'exact' });

    if (listingType !== 'all') query = query.eq('listing_type', listingType);
    if (city !== 'all') query = query.eq('city', city);
    if (type !== 'all') query = query.eq('type', type);
    if (bedrooms !== 'any') query = query.gte('bedrooms', parseInt(bedrooms));
    if (minPrice) query = query.gte('price', parseInt(minPrice));
    if (maxPrice) query = query.lte('price', parseInt(maxPrice));
    if (search) query = query.ilike('title', `%${search}%`);

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'price_low') query = query.order('price', { ascending: true });
    else if (sortBy === 'price_high') query = query.order('price', { ascending: false });

    const from = reset ? 0 : page * PROPERTIES_PER_PAGE;
    const to = from + PROPERTIES_PER_PAGE - 1;

    const { data, count, error } = await query.range(from, to);

    if (!error && data) {
      const mappedData = data as Property[];

      if (reset) {
        setProperties(mappedData);
        setPage(0);
      } else {
        setProperties(prev => [...prev, ...mappedData]);
      }
      setHasMore(count ? (reset ? mappedData.length : properties.length + mappedData.length) < count : false);
    }
    setLoading(false);
  };

  const toggleFavorite = (propertyId: string) => {
    if (!user) return;
    setFavorites(prev => {
      const n = new Set(prev);
      const isFavorited = n.has(propertyId);

      if (isFavorited) {
        n.delete(propertyId);
      } else {
        n.add(propertyId);
      }

      // Use RPC to toggle securely bypassing RLS
      (supabase.rpc as any)('toggle_favorite_rpc', {
        p_user_id: user.id,
        p_property_id: propertyId
      }).then(({ error }: any) => {
        if (error) {
          console.error('[Properties] Toggle Favorite RPC failed:', error);
          // Fallback for real session if RPC missing
          if (isFavorited) {
            supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId).then();
          } else {
            supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId }).then();
          }
        }
      });

      return n;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container py-8 px-4 mx-auto">
        {/* Header Section - More Compact */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 leading-tight">
              {listingType === 'rent' ? t('nav.rent') : listingType === 'sale' ? t('nav.buy') : t('properties.title').split(' ').slice(0, 3).join(' ')}
              {listingType === 'all' && <span className="text-primary italic ml-2">{t('properties.title').split(' ').slice(3).join(' ')}</span>}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {t('properties.subtitle')}
            </p>
          </div>

          {/* Only show search toggle if no type param exists */}
          {!typeParam && (
            <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/40 h-12 self-start md:self-auto">
              {[
                { id: 'all', label: t('properties.all_assets') },
                { id: 'sale', label: t('properties.buy_property') },
                { id: 'rent', label: t('properties.rent_property') }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setListingType(item.id as any)}
                  className={cn(
                    "px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    listingType === item.id
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters Section - More Compact */}
        <div className="relative mb-12 rounded-3xl bg-white p-6 border border-slate-200/60 shadow-lg shadow-slate-200/10 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t('properties.search_placeholder')}
                className="h-12 rounded-xl border-slate-200/60 bg-slate-50/30 pl-11 shadow-none focus:bg-white focus:ring-primary/10 transition-all placeholder:text-slate-400 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:flex gap-3 w-full lg:w-auto">
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-12 w-full lg:w-40 rounded-xl border-slate-200/60 bg-slate-50/30 hover:bg-white text-sm">
                  <SelectValue placeholder={t('properties.location')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">{t('properties.all_cities')}</SelectItem>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 w-full lg:w-40 rounded-xl border-slate-200/60 bg-slate-50/30 hover:bg-white text-sm">
                  <SelectValue placeholder={t('properties.type')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">{t('properties.all_types')}</SelectItem>
                  {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="capitalize">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 col-span-2 md:col-span-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                  <Input
                    placeholder={t('properties.min_price')}
                    type="number"
                    className="h-12 rounded-xl border-slate-200/60 bg-slate-50/30 pl-6 hover:bg-white text-sm"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                  />
                </div>
                <Input
                  placeholder={t('properties.max_price')}
                  type="number"
                  className="h-12 rounded-xl border-slate-200/60 bg-slate-50/30 px-3 hover:bg-white text-sm flex-1"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                />
              </div>

              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger className="h-12 w-full lg:w-28 rounded-xl border-slate-200/60 bg-slate-50/30 hover:bg-white text-sm">
                  <SelectValue placeholder={t('properties.beds')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="any">{t('properties.any_beds')}</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map(n => <SelectItem key={n} value={n.toString()}>{n}+</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 w-full lg:w-44 rounded-xl border-slate-200 bg-white text-sm">
                  <SelectValue placeholder={t('properties.sort')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="newest">{t('properties.newest_first')}</SelectItem>
                  <SelectItem value="price_low">{t('properties.price_low_to_high')}</SelectItem>
                  <SelectItem value="price_high">{t('properties.price_high_to_low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && properties.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="mb-6 flex items-center justify-between animate-fade-in">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {t('properties.showing')} <span className="text-primary italic">{properties.length}</span> {t('properties.luxury_properties')}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p, idx) => (
                <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${(idx % 3) * 0.05}s` }}>
                  <PropertyCard property={p} isFavorited={favorites.has(p.id)} onToggleFavorite={toggleFavorite} showStatus={true} />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={() => { setPage(p => p + 1); fetchProperties(); }}
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-10 h-12 font-bold border-2 hover:bg-primary hover:text-white transition-all"
                >
                  {t('properties.load_more')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-white animate-scale-in">
            <Building2 className="mx-auto h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-8 text-sm">Try adjusting your filters to find what you're looking for.</p>
            <Button
              size="sm"
              className="rounded-xl px-8"
              onClick={() => { setSearch(''); setCity('all'); setType('all'); setMinPrice(''); setMaxPrice(''); setBedrooms('any'); }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
