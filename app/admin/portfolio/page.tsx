'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  purpose: string;
  language_style: string;
  allocation_percentage: number;
  display_order: number;
}

interface Holding {
  id: string;
  category_id: string;
  symbol: string;
  name: string;
  description: string;
  logo_url?: string;
  observed_return?: string;
  display_order: number;
}

export default function AdminPortfolio() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'holding'; id: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const role = await getUserRole(user.id);
    if (role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const [categoriesResult, holdingsResult] = await Promise.all([
      supabase.from('portfolio_categories').select('*').order('display_order'),
      supabase.from('portfolio_holdings').select('*').order('display_order'),
    ]);

    if (categoriesResult.data) setCategories(categoriesResult.data);
    if (holdingsResult.data) setHoldings(holdingsResult.data);
  };

  const saveCategory = async () => {
    if (!editingCategory) return;

    try {
      if (editingCategory.id && editingCategory.id.length > 5) {
        const { error } = await supabase
          .from('portfolio_categories')
          .update({
            name: editingCategory.name,
            purpose: editingCategory.purpose,
            language_style: editingCategory.language_style,
            allocation_percentage: editingCategory.allocation_percentage,
            display_order: editingCategory.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('portfolio_categories').insert({
          name: editingCategory.name,
          purpose: editingCategory.purpose,
          language_style: editingCategory.language_style,
          allocation_percentage: editingCategory.allocation_percentage,
          display_order: editingCategory.display_order,
        });

        if (error) throw error;
      }

      toast({ title: 'Category saved' });
      setDialogOpen(false);
      setEditingCategory(null);
      await loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({ title: 'Error', description: 'Failed to save category', variant: 'destructive' });
    }
  };

  const saveHolding = async () => {
    if (!editingHolding) return;

    try {
      if (editingHolding.id && editingHolding.id.length > 5) {
        const { error } = await supabase
          .from('portfolio_holdings')
          .update({
            symbol: editingHolding.symbol,
            name: editingHolding.name,
            description: editingHolding.description,
            logo_url: editingHolding.logo_url,
            observed_return: editingHolding.observed_return,
            display_order: editingHolding.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingHolding.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('portfolio_holdings').insert({
          category_id: editingHolding.category_id,
          symbol: editingHolding.symbol,
          name: editingHolding.name,
          description: editingHolding.description,
          logo_url: editingHolding.logo_url,
          observed_return: editingHolding.observed_return,
          display_order: editingHolding.display_order,
        });

        if (error) throw error;
      }

      toast({ title: 'Holding saved' });
      setDialogOpen(false);
      setEditingHolding(null);
      await loadData();
    } catch (error) {
      console.error('Error saving holding:', error);
      toast({ title: 'Error', description: 'Failed to save holding', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'category') {
        const { error } = await supabase
          .from('portfolio_categories')
          .delete()
          .eq('id', deleteTarget.id);

        if (error) throw error;
        toast({ title: 'Category deleted' });
      } else {
        const { error } = await supabase
          .from('portfolio_holdings')
          .delete()
          .eq('id', deleteTarget.id);

        if (error) throw error;
        toast({ title: 'Holding deleted' });
      }

      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar userRole="admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Portfolio Editor</h1>
                <p className="text-slate-600">Manage portfolio categories and holdings</p>
              </div>
              <Dialog open={dialogOpen && !!editingCategory && !editingCategory.id} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingCategory({
                      id: '',
                      name: '',
                      purpose: '',
                      language_style: '',
                      allocation_percentage: 0,
                      display_order: categories.length + 1,
                    });
                    setDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-4">
                        <span>{category.name}</span>
                        <span className="text-lg font-semibold text-blue-600">
                          {category.allocation_percentage}%
                        </span>
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-2">{category.purpose}</p>
                      <p className="text-sm text-slate-500 italic mt-1">{category.language_style}</p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={dialogOpen && editingCategory?.id === category.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setEditingCategory(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                          </DialogHeader>
                          {editingCategory && (
                            <div className="space-y-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  value={editingCategory.name}
                                  onChange={(e) =>
                                    setEditingCategory({ ...editingCategory, name: e.target.value })
                                  }
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label>Purpose</Label>
                                <Textarea
                                  value={editingCategory.purpose}
                                  onChange={(e) =>
                                    setEditingCategory({ ...editingCategory, purpose: e.target.value })
                                  }
                                  className="mt-2"
                                  rows={2}
                                />
                              </div>
                              <div>
                                <Label>Institutional Description</Label>
                                <Textarea
                                  value={editingCategory.language_style}
                                  onChange={(e) =>
                                    setEditingCategory({ ...editingCategory, language_style: e.target.value })
                                  }
                                  className="mt-2"
                                  rows={2}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Allocation %</Label>
                                  <Input
                                    type="number"
                                    value={editingCategory.allocation_percentage}
                                    onChange={(e) =>
                                      setEditingCategory({
                                        ...editingCategory,
                                        allocation_percentage: Number(e.target.value),
                                      })
                                    }
                                    className="mt-2"
                                  />
                                </div>
                                <div>
                                  <Label>Display Order</Label>
                                  <Input
                                    type="number"
                                    value={editingCategory.display_order}
                                    onChange={(e) =>
                                      setEditingCategory({
                                        ...editingCategory,
                                        display_order: Number(e.target.value),
                                      })
                                    }
                                    className="mt-2"
                                  />
                                </div>
                              </div>
                              <Button onClick={saveCategory} className="w-full">
                                <Save className="w-4 h-4 mr-2" />
                                Save Category
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget({ type: 'category', id: category.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Holdings</h3>
                    <Dialog open={dialogOpen && editingHolding?.category_id === category.id && !editingHolding.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) setEditingHolding(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingHolding({
                              id: '',
                              category_id: category.id,
                              symbol: '',
                              name: '',
                              description: '',
                              observed_return: '',
                              display_order: holdings.filter(h => h.category_id === category.id).length + 1,
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Holding
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {holdings
                      .filter((h) => h.category_id === category.id)
                      .map((holding) => (
                        <div key={holding.id} className="border rounded-lg p-4 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-slate-900">{holding.symbol}</span>
                              <span className="text-slate-600">{holding.name}</span>
                              {holding.observed_return && (
                                <span className="text-sm font-semibold text-green-600">
                                  {holding.observed_return}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{holding.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog open={dialogOpen && editingHolding?.id === holding.id} onOpenChange={(open) => {
                              setDialogOpen(open);
                              if (!open) setEditingHolding(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingHolding(holding);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Holding</DialogTitle>
                                </DialogHeader>
                                {editingHolding && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Symbol</Label>
                                        <Input
                                          value={editingHolding.symbol}
                                          onChange={(e) =>
                                            setEditingHolding({ ...editingHolding, symbol: e.target.value })
                                          }
                                          className="mt-2"
                                        />
                                      </div>
                                      <div>
                                        <Label>Name</Label>
                                        <Input
                                          value={editingHolding.name}
                                          onChange={(e) =>
                                            setEditingHolding({ ...editingHolding, name: e.target.value })
                                          }
                                          className="mt-2"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <Textarea
                                        value={editingHolding.description}
                                        onChange={(e) =>
                                          setEditingHolding({ ...editingHolding, description: e.target.value })
                                        }
                                        className="mt-2"
                                        rows={3}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Observed Return</Label>
                                        <Input
                                          value={editingHolding.observed_return || ''}
                                          onChange={(e) =>
                                            setEditingHolding({ ...editingHolding, observed_return: e.target.value })
                                          }
                                          placeholder="e.g., +30-60%"
                                          className="mt-2"
                                        />
                                      </div>
                                      <div>
                                        <Label>Display Order</Label>
                                        <Input
                                          type="number"
                                          value={editingHolding.display_order}
                                          onChange={(e) =>
                                            setEditingHolding({
                                              ...editingHolding,
                                              display_order: Number(e.target.value),
                                            })
                                          }
                                          className="mt-2"
                                        />
                                      </div>
                                    </div>
                                    <Button onClick={saveHolding} className="w-full">
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Holding
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget({ type: 'holding', id: holding.id })}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {deleteTarget?.type === 'category' ? 'category and all its holdings' : 'holding'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
