import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Property } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';


export default function Favorites() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      // Use Ultra RPC to fetch favorites bypassing RLS
      const { data, error } = await (supabase.rpc as any)('get_user_favorites_ultra_rpc', {
        p_user_id: user.id
      });

      if (error) {
        console.warn('[Favorites] Ultra RPC failed, trying basic select:', error);
        const { data: basicData } = await supabase
          .from('favorites')
          .select('property_id, properties(*, property_images(*))')
          .eq('user_id', user.id);
        const items = (basicData || []).map((f: any) => f.properties).filter(Boolean);
        setProperties(items);
        setFavIds(new Set(items.map((p: Property) => p.id)));
      } else {
        const items = (data || []).map((f: any) => f.properties).filter(Boolean);
        setProperties(items);
        setFavIds(new Set(items.map((p: Property) => p.id)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFavorites(); }, [user]);

  const toggleFavorite = async (propertyId: string) => {
    if (!user) return;

    // Toggle via RPC
    await (supabase.rpc as any)('toggle_favorite_rpc', {
      p_user_id: user.id,
      p_property_id: propertyId
    });

    setProperties(prev => prev.filter(p => p.id !== propertyId));
    setFavIds(prev => {
      const n = new Set(prev);
      n.delete(propertyId);
      return n;
    });
  };

  return (
    <div className="min-h-screen bg-background">

      <div className="container py-8">
        <h1 className="mb-6 font-display text-3xl font-bold">My Favorites</h1>
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : properties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map(p => <PropertyCard key={p.id} property={p} isFavorited={true} onToggleFavorite={toggleFavorite} />)}
          </div>
        ) : (
          <p className="py-20 text-center text-muted-foreground">No favorites yet. Browse properties to save some!</p>
        )}
      </div>
    </div>
  );
}
