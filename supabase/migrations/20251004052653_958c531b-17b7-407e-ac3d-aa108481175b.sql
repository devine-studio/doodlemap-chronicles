-- Create pins table
CREATE TABLE public.pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  image_url TEXT,
  author TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add constraint to ensure valid coordinates
  CONSTRAINT valid_latitude CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT valid_longitude CHECK (lng >= -180 AND lng <= 180)
);

-- Enable Row Level Security
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view pins (public map)
CREATE POLICY "Anyone can view pins"
ON public.pins
FOR SELECT
USING (true);

-- Allow anyone to create pins (anonymous posting)
CREATE POLICY "Anyone can create pins"
ON public.pins
FOR INSERT
WITH CHECK (true);

-- Add index for better query performance
CREATE INDEX idx_pins_created_at ON public.pins(created_at DESC);
CREATE INDEX idx_pins_location ON public.pins(lat, lng);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.pins;