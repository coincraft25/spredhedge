'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPerformance() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [navHistory, setNavHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    mtd_return: 1.8,
    ytd_return: 12.4,
    sixm_return: 14.2,
    max_drawdown: 2.9,
  });
  const [newEntry, setNewEntry] = useState({
    date: '',
    nav: '',
    aum_usd: '',
  });

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
    const [navRes, metricsRes] = await Promise.all([
      supabase.from('nav_history').select('*').order('date', { ascending: true }),
      supabase.from('performance_metrics').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (navRes.data) setNavHistory(navRes.data);
    if (metricsRes.data) setMetrics(metricsRes.data);
  };

  const handleAddEntry = async () => {
    if (!newEntry.date || !newEntry.nav || !newEntry.aum_usd) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('nav_history').insert([
        {
          date: newEntry.date,
          nav: Number(newEntry.nav),
          aum_usd: Number(newEntry.aum_usd),
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Entry added',
        description: 'NAV history entry has been added',
      });

      setNewEntry({ date: '', nav: '', aum_usd: '' });
      await loadData();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to add entry',
        variant: 'destructive',
      });
    }
  };

  const handleSaveMetrics = async () => {
    try {
      const { error } = await supabase.from('performance_metrics').upsert([
        {
          period: 'current',
          mtd_return: Number(metrics.mtd_return),
          ytd_return: Number(metrics.ytd_return),
          sixm_return: Number(metrics.sixm_return),
          max_drawdown: Number(metrics.max_drawdown),
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Metrics saved',
        description: 'Performance metrics have been updated',
      });

      await loadData();
    } catch (error) {
      console.error('Error saving metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to save metrics',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const displayData = navHistory.length > 0 ? navHistory : [
    { date: '2024-05', nav: 1.000, aum_usd: 10000000 },
    { date: '2024-06', nav: 1.024, aum_usd: 10240000 },
    { date: '2024-07', nav: 1.051, aum_usd: 10850000 },
    { date: '2024-08', nav: 1.089, aum_usd: 11620000 },
    { date: '2024-09', nav: 1.118, aum_usd: 12050000 },
    { date: '2024-10', nav: 1.142, aum_usd: 12400000 },
  ];

  return (
    <>
      <Navbar userRole="admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Performance</h1>
              <p className="text-slate-600">Manage NAV history and performance metrics</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add NAV Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nav">NAV</Label>
                    <Input
                      id="nav"
                      type="number"
                      step="0.0001"
                      value={newEntry.nav}
                      onChange={(e) => setNewEntry({ ...newEntry, nav: e.target.value })}
                      placeholder="1.0000"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aum">AUM (USD)</Label>
                    <Input
                      id="aum"
                      type="number"
                      value={newEntry.aum_usd}
                      onChange={(e) => setNewEntry({ ...newEntry, aum_usd: e.target.value })}
                      placeholder="12400000"
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleAddEntry} className="w-full">
                    Add Entry
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="mtd">MTD Return (%)</Label>
                    <Input
                      id="mtd"
                      type="number"
                      step="0.1"
                      value={metrics.mtd_return}
                      onChange={(e) =>
                        setMetrics({ ...metrics, mtd_return: Number(e.target.value) })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ytd">YTD Return (%)</Label>
                    <Input
                      id="ytd"
                      type="number"
                      step="0.1"
                      value={metrics.ytd_return}
                      onChange={(e) =>
                        setMetrics({ ...metrics, ytd_return: Number(e.target.value) })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sixm">6M Return (%)</Label>
                    <Input
                      id="sixm"
                      type="number"
                      step="0.1"
                      value={metrics.sixm_return}
                      onChange={(e) =>
                        setMetrics({ ...metrics, sixm_return: Number(e.target.value) })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="drawdown">Max Drawdown (%)</Label>
                    <Input
                      id="drawdown"
                      type="number"
                      step="0.1"
                      value={metrics.max_drawdown}
                      onChange={(e) =>
                        setMetrics({ ...metrics, max_drawdown: Number(e.target.value) })
                      }
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleSaveMetrics} className="w-full">
                    Save Metrics
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>NAV History Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={displayData}>
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="nav" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
