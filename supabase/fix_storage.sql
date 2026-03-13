-- 1. Ensure the storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clear out any old restrictive policies for this bucket
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;

-- 3. Create fresh, working policies
-- Allow anyone to see images (even if not logged in)
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'property-images');

-- Allow any logged-in user to upload images
CREATE POLICY "Authenticated Upload" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'property-images');

-- Allow owners to delete their own images
CREATE POLICY "Owner Deletion" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
