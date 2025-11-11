'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { getPublishedBlogPosts, getBlogCategories } from '@/lib/supabase/blog';
import type { BlogPostWithCategory, BlogCategory } from '@/lib/supabase/blog';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const POSTS_PER_PAGE = 9;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts(true);
  }, [search, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const data = await getBlogCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async (reset = false) => {
    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await getPublishedBlogPosts({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        limit: POSTS_PER_PAGE + 1,
        offset: newOffset,
      });

      if (data) {
        const hasMorePosts = data.length > POSTS_PER_PAGE;
        const postsToShow = hasMorePosts ? data.slice(0, POSTS_PER_PAGE) : data;

        if (reset) {
          setPosts(postsToShow);
          setOffset(POSTS_PER_PAGE);
        } else {
          setPosts([...posts, ...postsToShow]);
          setOffset(newOffset + POSTS_PER_PAGE);
        }

        setHasMore(hasMorePosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  const getCategoryColor = (categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return '#3b82f6';
    const category = categories.find(c => c.id === categoryIds[0]);
    return category?.color || '#3b82f6';
  };

  const getCategoryName = (categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return null;
    const category = categories.find(c => c.id === categoryIds[0]);
    return category?.name;
  };

  return (
    <>
      <Navbar />
      <div className="bg-white min-h-screen">
        <section className="border-b">
          <div className="container mx-auto px-6 py-16">
            <h1 className="text-6xl font-bold text-slate-900 mb-3">The Edge</h1>
            <p className="text-lg text-slate-600">
              Signals, frameworks, and reflections from inside SpredHedge.
            </p>
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-col gap-6 mb-12">
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 py-6 text-base border-slate-300"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={selectedCategory === null ? 'bg-slate-900 hover:bg-slate-800' : 'hover:bg-slate-100'}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id ? 'bg-slate-900 hover:bg-slate-800' : 'hover:bg-slate-100'}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {loading && posts.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-32">
                <p className="text-2xl text-slate-800 font-medium">The Edge is being sharpened.</p>
                <p className="text-lg text-slate-500 mt-2">Come back soon.</p>
              </div>
            ) : (
              <>
                {featuredPost && (
                  <div className="block mb-12">
                    <Card className="overflow-hidden border border-slate-200 hover:border-slate-300 transition-all">
                      <div className="grid md:grid-cols-2 gap-0">
                        {featuredPost.cover_image_url && (
                          <div className="relative h-80 md:h-full bg-slate-100">
                            <img
                              src={featuredPost.cover_image_url}
                              alt={featuredPost.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-10 flex flex-col justify-center">
                          {getCategoryName(featuredPost.category_ids) && (
                            <div className="mb-4 text-sm font-medium text-slate-600">
                              [{getCategoryName(featuredPost.category_ids)}]
                            </div>
                          )}
                          <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                            {featuredPost.title}
                          </h2>
                          <p className="text-base text-slate-600 mb-6 leading-relaxed">
                            {featuredPost.excerpt}
                          </p>
                          <div className="flex items-center text-slate-900 font-medium group-hover:gap-2 transition-all">
                            <span>Read Entry</span>
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                  {otherPosts.map((post) => (
                    <div key={post.id} className="block">
                      <Card className="h-full overflow-hidden border border-slate-200 hover:border-slate-300 transition-all">
                        {post.cover_image_url && (
                          <div className="relative h-56 bg-slate-100">
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-8">
                          {getCategoryName(post.category_ids) && (
                            <div className="mb-3 text-sm font-medium text-slate-600">
                              [{getCategoryName(post.category_ids)}]
                            </div>
                          )}
                          <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center text-slate-900 font-medium group-hover:gap-2 transition-all">
                            <span>Read Entry</span>
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-12">
                    <Button
                      onClick={() => fetchPosts(false)}
                      disabled={loading}
                      size="lg"
                      variant="outline"
                      className="border-slate-300 hover:bg-slate-100"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <footer className="border-t py-12 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">SpredHedge</h3>
                <p className="text-sm text-slate-600">
                  Private digital capital management for qualified partners.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Contact</h3>
                <p className="text-sm text-slate-600">invest@spredhedge.io</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Legal</h3>
                <p className="text-sm text-slate-600">
                  This site is for informational purposes only and does not constitute an offer or solicitation.
                </p>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-xs text-slate-500">
              <p>
                © 2024 SpredHedge. All rights reserved. This site is for informational purposes only. Past activity is not indicative of future results.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
