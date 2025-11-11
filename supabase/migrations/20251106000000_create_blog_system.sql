/*
  # Create Blog System Tables

  ## Overview
  Creates the complete blog system for The Edge including blog posts, categories, and image storage.

  ## New Tables

  ### blog_categories
  Organizes blog posts by topic/theme.
  - Columns: id, name, slug, color (for UI badges), created_at
  - Unique slug constraint for URL-friendly categories

  ### blog_posts
  Full-featured blog post system with rich content.
  - Core fields: title, slug, content (HTML), excerpt
  - Metadata: author, cover_image_url, status (draft/published)
  - Categories: category_ids (array of category UUIDs)
  - Analytics: view_count, published_at
  - Audit: created_by, created_at, updated_at

  ## Storage Bucket
  - blog-images: Public bucket for cover images and inline content images

  ## Security
  - RLS enabled on both tables
  - Authenticated users can read published posts
  - Admins have full CRUD access to all posts and categories
  - Public read access to blog-images storage bucket
  - Admin-only write access to blog-images

  ## Functions
  - increment_blog_view_count: Safe way to increment view counts without direct update access
*/

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  excerpt text,
  author text NOT NULL,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category_ids uuid[] DEFAULT ARRAY[]::uuid[],
  view_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_ids ON blog_posts USING GIN(category_ids);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories

-- Everyone can read categories
CREATE POLICY "Anyone can read blog categories"
  ON blog_categories FOR SELECT
  TO public
  USING (true);

-- Admins can insert categories
CREATE POLICY "Admins can insert blog categories"
  ON blog_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Admins can update categories
CREATE POLICY "Admins can update blog categories"
  ON blog_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete categories
CREATE POLICY "Admins can delete blog categories"
  ON blog_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for blog_posts

-- Authenticated users can read published posts
CREATE POLICY "Authenticated users can read blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (
    -- Admin can read all posts
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Others can only read published posts
    (status = 'published')
  );

-- Admins can insert blog posts
CREATE POLICY "Admins can insert blog posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Admins can update blog posts
CREATE POLICY "Admins can update blog posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete blog posts
CREATE POLICY "Admins can delete blog posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Create blog-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog-images

-- Anyone can read blog images (public bucket)
CREATE POLICY "Anyone can read blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Admins can upload blog images
CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admins can update blog images
CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admins can delete blog images
CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Function to safely increment blog post view count
CREATE OR REPLACE FUNCTION increment_blog_view_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, color) VALUES
  ('Macro Signals', 'macro-signals', '#3B82F6'),
  ('Playbook', 'playbook', '#F59E0B'),
  ('Strategy', 'strategy', '#F97316'),
  ('Bitcoin Treasury', 'bitcoin-treasury', '#EAB308'),
  ('Positions & Performance', 'positions-performance', '#10B981'),
  ('Top Picks', 'top-picks', '#8B5CF6'),
  ('Passive Income', 'passive-income', '#059669'),
  ('Market Updates', 'market-updates', '#64748B')
ON CONFLICT (slug) DO NOTHING;
