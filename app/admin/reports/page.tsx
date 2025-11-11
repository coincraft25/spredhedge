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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ExternalLink } from 'lucide-react';
import { PdfUpload } from '@/components/pdf-upload';

export default function AdminReports() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [newReport, setNewReport] = useState({
    month: '',
    title: '',
    summary: '',
    file_url: '',
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
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('month', { ascending: false });

    if (data) setReports(data);
  };

  const handleAdd = async () => {
    if (!newReport.month || !newReport.title || !newReport.file_url) {
      toast({
        title: 'Validation Error',
        description: 'Month, title, and file URL are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('reports').insert([
        {
          month: newReport.month,
          title: newReport.title,
          summary: newReport.summary,
          file_url: newReport.file_url,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Report added',
        description: 'Monthly report has been added',
      });

      setNewReport({ month: '', title: '', summary: '', file_url: '' });
      await loadData();
    } catch (error) {
      console.error('Error adding report:', error);
      toast({
        title: 'Error',
        description: 'Failed to add report',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const report = reports.find((r) => r.id === id);

      if (report?.file_url) {
        const urlParts = report.file_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = decodeURIComponent(fileName);

        const { error: storageError } = await supabase.storage
          .from('reports')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }

      const { error } = await supabase.from('reports').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Report deleted',
        description: 'Report and PDF file have been deleted',
      });

      await loadData();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete report',
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

  return (
    <>
      <Navbar userRole="admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Reports</h1>
              <p className="text-slate-600">Upload and manage monthly reports</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Add New Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="month">Month (YYYY-MM)</Label>
                    <Input
                      id="month"
                      type="month"
                      value={newReport.month}
                      onChange={(e) =>
                        setNewReport({ ...newReport, month: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newReport.title}
                      onChange={(e) =>
                        setNewReport({ ...newReport, title: e.target.value })
                      }
                      placeholder="October 2024 Monthly Report"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={newReport.summary}
                    onChange={(e) =>
                      setNewReport({ ...newReport, summary: e.target.value })
                    }
                    placeholder="Brief summary of the report (max 240 chars)"
                    maxLength={240}
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <PdfUpload
                  onUploadComplete={(fileUrl, fileName) => {
                    setNewReport({ ...newReport, file_url: fileUrl });
                  }}
                  currentFileUrl={newReport.file_url}
                />
                <Button onClick={handleAdd} disabled={!newReport.file_url}>
                  Add Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>PDF</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {new Date(report.month + '-01').toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell className="max-w-md text-slate-600">
                          {report.summary}
                        </TableCell>
                        <TableCell>
                          {report.file_url && (
                            <a
                              href={report.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm"
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(report.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {reports.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-600">No reports yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
