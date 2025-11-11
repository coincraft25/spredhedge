'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResetPasswordModal } from '@/components/admin/reset-password-modal';
import { KeyRound } from 'lucide-react';

export default function AdminInvestors() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [passwordResetInvestor, setPasswordResetInvestor] = useState<any>(null);

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
      .from('investors')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order('joined_at', { ascending: false });

    if (data) setInvestors(data);
  };

  const handleOpenResetPassword = (investor: any) => {
    setPasswordResetInvestor({
      id: investor.id,
      user_id: investor.user_id,
      full_name: investor.profiles?.full_name || 'Unknown',
      email: investor.profiles?.email || 'Unknown',
    });
    setResetPasswordModalOpen(true);
  };

  const updateNotes = async (investorId: string, notes: string) => {
    const { error } = await supabase
      .from('investors')
      .update({ notes })
      .eq('id', investorId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notes',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Notes updated',
      });
      await loadData();
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
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Investors</h1>
                <p className="text-slate-600">Manage investor accounts and access</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Investors</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investors.map((investor) => (
                      <TableRow key={investor.id}>
                        <TableCell className="font-medium">
                          {investor.profiles?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>{investor.profiles?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={investor.status === 'active' ? 'default' : 'secondary'}
                          >
                            {investor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(investor.joined_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenResetPassword(investor)}
                            >
                              <KeyRound className="w-4 h-4 mr-2" />
                              Reset Password
                            </Button>
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedInvestor(investor)}
                                >
                                  View
                                </Button>
                              </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>Investor Details</SheetTitle>
                              </SheetHeader>
                              {selectedInvestor && (
                                <div className="space-y-6 mt-6">
                                  <div>
                                    <Label>Full Name</Label>
                                    <p className="text-slate-900 mt-1">
                                      {selectedInvestor.profiles?.full_name || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-slate-900 mt-1">
                                      {selectedInvestor.profiles?.email || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <p className="text-slate-900 mt-1 capitalize">
                                      {selectedInvestor.status}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Joined</Label>
                                    <p className="text-slate-900 mt-1">
                                      {new Date(selectedInvestor.joined_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                      id="notes"
                                      defaultValue={selectedInvestor.notes || ''}
                                      onBlur={(e) =>
                                        updateNotes(selectedInvestor.id, e.target.value)
                                      }
                                      rows={4}
                                      className="mt-2"
                                    />
                                  </div>
                                </div>
                              )}
                              </SheetContent>
                            </Sheet>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {investors.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-600">No investors yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {passwordResetInvestor && (
        <ResetPasswordModal
          open={resetPasswordModalOpen}
          onOpenChange={setResetPasswordModalOpen}
          investor={passwordResetInvestor}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </>
  );
}
