-- Create storage bucket for pin images
INSERT INTO storage.buckets (id, name, public) VALUES ('pin-images', 'pin-images', true);

-- Create policies for pin images bucket
CREATE POLICY "Anyone can view pin images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pin-images');

CREATE POLICY "Anyone can upload pin images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pin-images');