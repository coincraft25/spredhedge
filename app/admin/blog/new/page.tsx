'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/blog/rich-text-editor';
import { ArrowLeft, Save, Eye, Upload, Loader2 } from 'lucide-react';
import {
  createBlogPost,
  uploadBlogImage,
  generateSlug,
  getBlogCategories,
} from '@/lib/supabase/blog';
import type { BlogCategory } from '@/lib/supabase/blog';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUserWithProfile } from '@/lib/supabase/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    author: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    category_ids: [] as string[],
  });

  useEffect(() => {
    checkAuth();
    fetchCategories();
  }, []);

  const checkAuth = async () => {
    const { profile } = await getCurrentUserWithProfile();
    if (!profile || profile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUserRole(profile.role);
    setUserName(profile.full_name || 'Admin');
    setFormData((prev) => ({ ...prev, author: profile.full_name || 'Admin' }));
  };

  const fetchCategories = async () => {
    try {
      const data = await getBlogCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadBlogImage(file);
      setFormData({ ...formData, cover_image_url: url });
      toast({
        title: 'Cover image uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload cover image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Content is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const excerpt = formData.excerpt.trim()
        ? formData.excerpt
        : formData.content.replace(/<[^>]*>/g, '').substring(0, 160);

      await createBlogPost({
        ...formData,
        excerpt,
        status,
      });

      toast({
        title: `Post ${status === 'published' ? 'published' : 'saved as draft'} successfully`,
      });
      router.push('/admin/blog');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save post',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!userRole) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole="admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-6">
              <Link href="/admin/blog">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog Management
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-slate-900">Create New Post</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Draft
                </Button>
                <Button onClick={() => handleSave('published')} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Publish
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Enter post title"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="post-url-slug"
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        URL: /blog/{formData.slug || 'post-slug'}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Brief summary of the post (optional, will be auto-generated if empty)"
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <Label>Content *</Label>
                    <div className="mt-2">
                      <RichTextEditor
                        content={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        placeholder="Write your blog post content here..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category_ids[0] || ''}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category_ids: value ? [value] : [] })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <Label>Cover Image</Label>
                    <div className="mt-2">
                      {formData.cover_image_url ? (
                        <div className="space-y-2">
                          <img
                            src={formData.cover_image_url}
                            alt="Cover"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                            className="w-full"
                          >
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor="cover-upload"
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            {uploadingImage ? (
                              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600">Click to upload</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  PNG, JPG up to 5MB
                                </p>
                              </>
                            )}
                          </label>
                          <input
                            id="cover-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleCoverImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
