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
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminAllocations() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allocations, setAllocations] = useState<any[]>([]);

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
    const { data } = await supabase
      .from('allocations')
      .select('*')
      .order('allocation_pct', { ascending: false });

    if (data && data.length > 0) {
      setAllocations(data);
    } else {
      setAllocations([
        {
          id: '1',
          category: 'Digital Reserve',
          allocation_pct: 40,
          description: 'Core treasury holdings in established digital assets',
          thesis: 'Bitcoin and Ethereum provide liquid, established digital reserve assets with proven track records.',
        },
        {
          id: '2',
          category: 'Structured Yield Layer',
          allocation_pct: 25,
          description: 'High-grade yield generation across DeFi protocols',
          thesis: 'Diversified exposure to battle-tested lending protocols and stablecoin yields.',
        },
        {
          id: '3',
          category: 'Strategic Ventures',
          allocation_pct: 20,
          description: 'Thematic allocations with asymmetric upside',
          thesis: 'Selective positions in emerging L1/L2 infrastructure and DeFi primitives.',
        },
        {
          id: '4',
          category: 'Liquidity Buffer',
          allocation_pct: 15,
          description: 'Stablecoins for operational flexibility',
          thesis: 'USDC and USDT reserves for redemptions and opportunistic deployment.',
        },
      ]);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const total = allocations.reduce((sum, a) => sum + Number(a.allocation_pct), 0);
    if (Math.abs(total - 100) > 0.01) {
      toast({
        title: 'Validation Error',
        description: `Total allocation must equal 100%. Current total: ${total.toFixed(1)}%`,
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    try {
      for (const allocation of allocations) {
        if (allocation.id && allocation.id.length > 5) {
          await supabase
            .from('allocations')
            .update({
              allocation_pct: allocation.allocation_pct,
              description: allocation.description,
              thesis: allocation.thesis,
            })
            .eq('id', allocation.id);
        }
      }

      toast({
        title: 'Allocations saved',
        description: 'Fund allocations have been updated',
      });

      await loadData();
    } catch (error) {
      console.error('Error saving allocations:', error);
      toast({
        title: 'Error',
        description: 'Failed to save allocations',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAllocation = (index: number, field: string, value: any) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const total = allocations.reduce((sum, a) => sum + Number(a.allocation_pct), 0);

  return (
    <>
      <Navbar userRole="admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Allocations</h1>
                <p className="text-slate-600">Manage fund allocation strategy</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Fund Allocations</span>
                  <span
                    className={`text-lg ${
                      Math.abs(total - 100) < 0.01 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    Total: {total.toFixed(1)}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {allocations.map((allocation, index) => (
                  <div key={index} className="border-l-4 border-blue-600 pl-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={allocation.category}
                          onChange={(e) =>
                            updateAllocation(index, 'category', e.target.value)
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Allocation %</Label>
                        <Input
                          type="number"
                          value={allocation.allocation_pct}
                          onChange={(e) =>
                            updateAllocation(index, 'allocation_pct', Number(e.target.value))
                          }
                          min={0}
                          max={100}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={allocation.description}
                        onChange={(e) =>
                          updateAllocation(index, 'description', e.target.value)
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Thesis</Label>
                      <Textarea
                        value={allocation.thesis}
                        onChange={(e) =>
                          updateAllocation(index, 'thesis', e.target.value)
                        }
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
