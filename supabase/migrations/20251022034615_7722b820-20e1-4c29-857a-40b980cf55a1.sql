-- Create likes table
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  text text NOT NULL,
  author text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for likes
CREATE POLICY "Anyone can view likes"
  ON public.likes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create likes"
  ON public.likes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete likes"
  ON public.likes
  FOR DELETE
  USING (true);

-- RLS policies for comments
CREATE POLICY "Anyone can view comments"
  ON public.comments
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_likes_pin_id ON public.likes(pin_id);
CREATE INDEX idx_comments_pin_id ON public.comments(pin_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);