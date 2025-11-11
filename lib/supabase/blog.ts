import { supabase } from './client';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  author: string;
  cover_image_url: string | null;
  status: 'draft' | 'published';
  category_ids: string[] | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BlogPostWithCategory extends BlogPost {
  categories?: BlogCategory[];
}

export async function getBlogCategories() {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getPublishedBlogPosts(options?: {
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%,excerpt.ilike.%${options.search}%`);
  }

  if (options?.categoryId) {
    query = query.contains('category_ids', [options.categoryId]);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getBlogPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function incrementBlogPostViewCount(id: string) {
  const { error } = await supabase.rpc('increment_blog_view_count', { post_id: id });
  if (error) console.error('Error incrementing view count:', error);
}

export async function getAllBlogPostsForAdmin() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBlogPostById(id: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createBlogPost(post: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: string;
  cover_image_url?: string;
  category_ids?: string[];
  status: 'draft' | 'published';
}) {
  const insertData: any = {
    ...post,
    published_at: post.status === 'published' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('blog_posts')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBlogPost(
  id: string,
  updates: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    author?: string;
    cover_image_url?: string;
    category_ids?: string[];
    status?: 'draft' | 'published';
  }
) {
  const updateData: any = { ...updates };

  if (updates.status === 'published') {
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('status, published_at')
      .eq('id', id)
      .single();

    if (existingPost?.status === 'draft' && !existingPost.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBlogPost(id: string) {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);

  if (error) throw error;
}

export async function uploadBlogImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath);

  return data.publicUrl;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
