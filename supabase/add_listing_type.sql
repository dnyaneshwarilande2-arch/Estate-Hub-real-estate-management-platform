-- Add listing_type column to properties table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type') THEN
        CREATE TYPE public.listing_type AS ENUM ('sale', 'rent');
    END IF;
END $$;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS listing_type public.listing_type DEFAULT 'sale';

-- Update the insert RPC to handle listing_type
CREATE OR REPLACE FUNCTION public.insert_property_rpc(
    p_title TEXT,
    p_description TEXT,
    p_price NUMERIC,
    p_location TEXT,
    p_city TEXT,
    p_property_type TEXT,
    p_bedrooms INTEGER,
    p_bathrooms INTEGER,
    p_area NUMERIC,
    p_posted_by UUID,
    p_status TEXT,
    p_listing_type TEXT DEFAULT 'sale'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_property_id UUID;
BEGIN
  -- Insert bypassing RLS
  INSERT INTO public.properties (
      title, description, price, location, city, property_type, bedrooms, bathrooms, area, posted_by, status, listing_type
  ) VALUES (
      p_title, p_description, p_price, p_location, p_city, p_property_type::public.property_type, p_bedrooms, p_bathrooms, p_area, p_posted_by, p_status::public.property_status, p_listing_type::public.listing_type
  ) RETURNING id INTO new_property_id;
  
  RETURN new_property_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_property_rpc TO anon, authenticated;
