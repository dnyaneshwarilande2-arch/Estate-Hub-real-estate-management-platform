export type AppRole = 'user' | 'admin';
export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'sold';
export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'villa' | 'land' | 'commercial';
export type ListingType = 'sale' | 'rent';
export type InquiryStatus = 'pending' | 'responded' | 'closed' | 'approved';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  password?: string;
  intent?: 'buyer' | 'seller' | 'both' | 'none';
  phone: string;
  address: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: PropertyStatus;
  listing_type?: ListingType;
  posted_by: string;
  created_at: string;
  updated_at: string;
  property_images?: PropertyImage[];
  profiles?: Profile;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  properties?: Property;
}

export interface Inquiry {
  id: string;
  user_id: string;
  property_id: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  properties?: Property;
  profiles?: Profile;
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'villa', label: 'Villa' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

export const CITIES = [
  'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Mumbai',
  'Delhi', 'Ahmedabad', 'Coimbatore', 'Indore', 'Kochin',
  'Jaipur', 'Surat', 'Visakhapatnam', 'Vadodara', 'Gurugram',
  'Noida', 'Kolkata', 'Chandigarh', 'Bhubaneswar', 'Mysore',
];
