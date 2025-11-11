'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Metric {
  id: string;
  metric_key: string;
  metric_value: string;
}

interface NavDataPoint {
  id: string;
  month: string;
  value: number;
  display_order: number;
}

export default function HomepageSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [navData, setNavData] = useState<NavDataPoint[]>([]);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/dashboard');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, navRes] = await Promise.all([
        supabase
          .from('homepage_metrics')
          .select('*')
          .order('metric_key'),
        supabase
          .from('nav_data_points')
          .select('*')
          .order('display_order')
      ]);

      if (metricsRes.data) setMetrics(metricsRes.data);
      if (navRes.data) setNavData(navRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMetric = (key: string, value: string) => {
    setMetrics(prev =>
      prev.map(m => m.metric_key === key ? { ...m, metric_value: value } : m)
    );
  };

  const updateNavPoint = (id: string, field: 'month' | 'value', value: string | number) => {
    setNavData(prev =>
      prev.map(point => point.id === id ? { ...point, [field]: value } : point)
    );
  };

  const addNavPoint = () => {
    const maxOrder = Math.max(...navData.map(p => p.display_order), 0);
    const newPoint: NavDataPoint = {
      id: `temp-${Date.now()}`,
      month: '',
      value: 0,
      display_order: maxOrder + 1
    };
    setNavData([...navData, newPoint]);
  };

  const removeNavPoint = (id: string) => {
    setNavData(prev => prev.filter(p => p.id !== id));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      for (const metric of metrics) {
        await supabase
          .from('homepage_metrics')
          .update({
            metric_value: metric.metric_value,
            updated_by: session.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('metric_key', metric.metric_key);
      }

      await supabase.from('nav_data_points').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      for (const point of navData) {
        await supabase
          .from('nav_data_points')
          .insert({
            month: point.month,
            value: point.value,
            display_order: point.display_order,
            updated_by: session.user.id
          });
      }

      toast({
        title: 'Success',
        description: 'Homepage settings updated successfully'
      });

      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen">
          <Sidebar role="admin" />
          <main className="flex-1 bg-slate-50 p-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen">
        <Sidebar role="admin" />
        <main className="flex-1 bg-slate-50 p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Homepage Settings</h1>
              <p className="text-slate-600">Manage key metrics and NAV chart data displayed on the homepage</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                  <CardDescription>Update the four main metrics displayed below the hero section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {metrics.map(metric => (
                      <div key={metric.metric_key}>
                        <Label className="capitalize">
                          {metric.metric_key.replace(/_/g, ' ')}
                        </Label>
                        <Input
                          value={metric.metric_value}
                          onChange={(e) => updateMetric(metric.metric_key, e.target.value)}
                          placeholder="e.g., $12.4M"
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>NAV Chart Data</CardTitle>
                      <CardDescription>Manage the data points shown in the NAV growth chart</CardDescription>
                    </div>
                    <Button onClick={addNavPoint} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Point
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {navData.map((point, index) => (
                      <div key={point.id} className="flex items-center gap-4">
                        <div className="w-12 text-sm text-slate-500 font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <Input
                              value={point.month}
                              onChange={(e) => updateNavPoint(point.id, 'month', e.target.value)}
                              placeholder="Month (e.g., May)"
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              step="0.1"
                              value={point.value}
                              onChange={(e) => updateNavPoint(point.id, 'value', parseFloat(e.target.value) || 0)}
                              placeholder="Value (e.g., 124.3)"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNavPoint(point.id)}
                          disabled={navData.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={fetchData} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={saveChanges} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
