/*
  # Add Blog View Count Function

  Creates a function to safely increment the view count on blog posts.
  This function can be called from the client without exposing direct update access.
*/

CREATE OR REPLACE FUNCTION increment_blog_view_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
