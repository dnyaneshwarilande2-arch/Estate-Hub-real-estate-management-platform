import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/property';
import { formatCurrency, cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  isFavorited?: boolean;
  onToggleFavorite?: (propertyId: string) => void;
  showStatus?: boolean;
}

export function PropertyCard({ property, isFavorited, onToggleFavorite, showStatus }: PropertyCardProps) {
  const primaryImage = property.property_images?.find(i => i.is_primary) || property.property_images?.[0];
  const imageUrl = primaryImage?.image_url || '/placeholder.svg';

  return (
    <div className="property-card group">
      <Link to={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={imageUrl}
            alt={property.title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-700 group-hover:scale-110",
              property.status === 'sold' && "grayscale-[0.5] brightness-[0.7]"
            )}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {property.status === 'sold' && (
            <div className="absolute inset-0 z-10">
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Badge className="bg-red-600 text-white text-xl font-black px-8 py-3 tracking-[0.3em] border-2 border-white/20 shadow-[0_0_50px_rgba(220,38,38,0.5)] skew-x-[-15deg] rotate-[-7deg] uppercase h-auto">
                  Sold
                </Badge>
              </div>
            </div>
          )}

          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 z-10"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(property.id); }}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-destructive text-destructive' : ''}`} />
            </Button>
          )}

          {showStatus && (
            <div className="absolute left-4 top-4">
              <Badge className={cn(
                "badge-status",
                property.status === 'approved' ? 'badge-approved' :
                  property.status === 'pending' ? 'badge-pending' :
                    property.status === 'sold' ? 'bg-slate-900 border-white/20 text-white' : 'badge-rejected'
              )}>
                {property.status}
              </Badge>
            </div>
          )}

          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md border-none px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
              {property.property_type}
            </Badge>
            <Badge className={cn(
              "backdrop-blur-md border-none px-3 py-1 font-black uppercase tracking-wider text-[10px]",
              property.listing_type === 'rent' ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
            )}>
              {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-2 font-display text-xl font-bold leading-tight group-hover:text-primary transition-colors">{property.title}</div>
          <div className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {property.location}, {property.city}
          </div>

          <div className="mb-5 flex items-end justify-between">
            <div className="font-display text-2xl font-black text-primary">
              {formatCurrency(property.price)}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm animate-fade-in group-hover:bg-white transition-colors">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                {(property.profiles?.full_name || 'H')[0]}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Listed by</span>
                <span className="text-[10px] font-bold text-slate-800 leading-none mt-0.5">{property.profiles?.full_name || 'EstateHub Host'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-border/50 text-sm font-medium text-muted-foreground">
            {property.property_type !== 'land' && (
              <>
                <span className="flex items-center gap-2"><Bed className="h-4 w-4 text-primary/70" />{property.bedrooms} <span className="font-normal text-muted-foreground/60">Beds</span></span>
                <span className="flex items-center gap-2"><Bath className="h-4 w-4 text-primary/70" />{property.bathrooms} <span className="font-normal text-muted-foreground/60">Baths</span></span>
              </>
            )}
            <span className="flex items-center gap-2"><Maximize className="h-4 w-4 text-primary/70" />{property.area} <span className="font-normal text-muted-foreground/60">sqft</span></span>
          </div>
        </div>
      </Link>
    </div>
  );
}
