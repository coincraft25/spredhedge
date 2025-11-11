'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Download, FileText, ExternalLink, Eye } from 'lucide-react';

export default function Reports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'investor'>('investor');
  const [reports, setReports] = useState<any[]>([]);

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
    setUserRole(role as 'admin' | 'investor');

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('month', { ascending: false });

    if (data) setReports(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const defaultReports = [
    {
      month: '2024-10',
      title: 'October 2024 Monthly Report',
      summary: 'Strong performance driven by strategic rebalancing. NAV up 2.1% MoM with continued focus on yield optimization.',
    },
    {
      month: '2024-09',
      title: 'September 2024 Monthly Report',
      summary: 'Defensive positioning during market volatility. Increased liquidity buffer to 18% and reduced leverage exposure.',
    },
    {
      month: '2024-08',
      title: 'August 2024 Monthly Report',
      summary: 'Tactical deployment into emerging L2 infrastructure. Added 3% position in Base ecosystem protocols.',
    },
  ];

  const displayReports = reports.length > 0 ? reports : defaultReports;

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="flex">
        <Sidebar role={userRole} />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Reports</h1>
              <p className="text-slate-600">Monthly performance and portfolio updates</p>
            </div>

            <div className="space-y-4">
              {displayReports.map((report) => (
                <Card key={report.month}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {report.title}
                          </h3>
                          <p className="text-slate-600 leading-relaxed mb-3">
                            {report.summary}
                          </p>
                          <p className="text-sm text-slate-500">
                            Published: {new Date(report.month + '-01').toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {report.file_url ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(report.file_url, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <a
                              href={report.file_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </a>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Download className="h-4 w-4 mr-2" />
                            Not Available
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {displayReports.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No reports available yet</p>
                </CardContent>
              </Card>
            )}

            <footer className="text-center text-sm text-slate-500 pt-8 border-t">
              Confidential. For qualified partners only.
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}
