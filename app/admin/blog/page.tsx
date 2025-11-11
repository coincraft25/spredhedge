'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Eye, Edit, Trash2, FileText, Loader2 } from 'lucide-react';
import { getAllBlogPostsForAdmin, deleteBlogPost, updateBlogPost, getBlogCategories } from '@/lib/supabase/blog';
import type { BlogCategory } from '@/lib/supabase/blog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUserWithProfile } from '@/lib/supabase/auth';

export default function AdminBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchPosts();
      fetchCategories();
    }
  }, [userRole]);

  useEffect(() => {
    filterPosts();
  }, [posts, search, statusFilter]);

  const checkAuth = async () => {
    const { profile } = await getCurrentUserWithProfile();
    if (!profile || profile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUserRole(profile.role);
  };

  const fetchCategories = async () => {
    try {
      const data = await getBlogCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAllBlogPostsForAdmin();
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch blog posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    if (search) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.author.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      await deleteBlogPost(postToDelete);
      toast({
        title: 'Post deleted successfully',
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const togglePostStatus = async (postId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';

    try {
      await updateBlogPost(postId, { status: newStatus });
      toast({
        title: `Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update post status',
        variant: 'destructive',
      });
    }
  };

  const getCategoryName = (categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return 'Uncategorized';
    const category = categories.find((c) => c.id === categoryIds[0]);
    return category?.name || 'Uncategorized';
  };

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
  };

  if (loading) {
    return (
      <>
        <Navbar userRole="admin" />
        <div className="flex">
          <Sidebar role="admin" />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </main>
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Blog Management</h1>
                <p className="text-slate-600 mt-1">Create, edit, and manage blog posts</p>
              </div>
              <Link href="/admin/blog/new">
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Post
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Posts</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Published</p>
                      <p className="text-3xl font-bold text-green-600">{stats.published}</p>
                    </div>
                    <Eye className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Drafts</p>
                      <p className="text-3xl font-bold text-slate-600">{stats.draft}</p>
                    </div>
                    <Edit className="h-8 w-8 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search posts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === 'published' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('published')}
                  >
                    Published
                  </Button>
                  <Button
                    variant={statusFilter === 'draft' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('draft')}
                  >
                    Drafts
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No posts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell>{post.author}</TableCell>
                          <TableCell>{getCategoryName(post.category_ids)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={post.status === 'published' ? 'default' : 'secondary'}
                              className={
                                post.status === 'published'
                                  ? 'bg-green-600'
                                  : 'bg-slate-400'
                              }
                            >
                              {post.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{post.view_count || 0}</TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {post.published_at
                              ? format(new Date(post.published_at), 'MMM d, yyyy')
                              : format(new Date(post.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePostStatus(post.id, post.status)}
                              >
                                {post.status === 'published' ? 'Unpublish' : 'Publish'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPostToDelete(post.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
