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
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, UserPlus, KeyRound } from 'lucide-react';
import { CreateAccountModal } from '@/components/admin/create-account-modal';

export default function AdminRequests() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const [accountCreationRequest, setAccountCreationRequest] = useState<any>(null);

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
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setRequests(data);
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request approved',
        description: 'You can now create an account for this investor.',
      });

      await loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request rejected',
      });

      await loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  const handleOpenCreateAccount = (request: any) => {
    setAccountCreationRequest(request);
    setCreateAccountModalOpen(true);
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'all') return true;
    return req.status === filterStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
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
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Access Requests</h1>
              <p className="text-slate-600">Review and approve investor access requests</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-slate-600 mb-1">Total Requests</div>
                  <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-blue-700 mb-1">Pending</div>
                  <div className="text-3xl font-bold text-blue-900">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-green-700 mb-1">Approved</div>
                  <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-red-700 mb-1">Rejected</div>
                  <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Requests</CardTitle>
                  <Tabs value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                      <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                      <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                      <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Investor Type</TableHead>
                      <TableHead>Investment Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.full_name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.investor_type || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            ${request.investment_amount?.replace('-', ' – ') || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === 'pending'
                                ? 'default'
                                : request.status === 'approved'
                                ? 'default'
                                : 'secondary'
                            }
                            className={
                              request.status === 'approved'
                                ? 'bg-green-600 hover:bg-green-700'
                                : request.status === 'rejected'
                                ? 'bg-red-600 hover:bg-red-700'
                                : ''
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.user_id ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Created
                            </Badge>
                          ) : request.status === 'approved' ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">
                              N/A
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  View
                                </Button>
                              </SheetTrigger>
                              <SheetContent className="overflow-y-auto">
                                <SheetHeader>
                                  <SheetTitle>Request Details</SheetTitle>
                                </SheetHeader>
                                {selectedRequest && (
                                  <div className="space-y-6 mt-6">
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Full Name
                                      </p>
                                      <p className="text-slate-900 mt-1">
                                        {selectedRequest.full_name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">Email</p>
                                      <p className="text-slate-900 mt-1">
                                        {selectedRequest.email}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Country
                                      </p>
                                      <p className="text-slate-900 mt-1">
                                        {selectedRequest.country}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Investor Type
                                      </p>
                                      <Badge variant="outline" className="mt-1">
                                        {selectedRequest.investor_type || 'N/A'}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Estimated Investment Amount
                                      </p>
                                      <Badge variant="secondary" className="mt-1">
                                        ${selectedRequest.investment_amount?.replace('-', ' – ') || 'N/A'}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Accredited Investor
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {selectedRequest.is_accredited ? (
                                          <>
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="text-green-700 font-medium">Confirmed</span>
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="w-5 h-5 text-red-600" />
                                            <span className="text-red-700 font-medium">Not Confirmed</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Legal Consent
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {selectedRequest.consent_given ? (
                                          <>
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="text-green-700 font-medium">Given</span>
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="w-5 h-5 text-red-600" />
                                            <span className="text-red-700 font-medium">Not Given</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {selectedRequest.message && (
                                      <div>
                                        <p className="text-sm font-medium text-slate-600">
                                          Message
                                        </p>
                                        <p className="text-slate-900 mt-1 p-3 bg-slate-50 rounded-md">
                                          {selectedRequest.message}
                                        </p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Submitted
                                      </p>
                                      <p className="text-slate-900 mt-1">
                                        {new Date(selectedRequest.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Status
                                      </p>
                                      <p className="text-slate-900 mt-1 capitalize">
                                        {selectedRequest.status}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        Account Status
                                      </p>
                                      {selectedRequest.user_id ? (
                                        <div className="mt-1 space-y-2">
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Account Created
                                          </Badge>
                                          {selectedRequest.account_created_at && (
                                            <p className="text-sm text-slate-600">
                                              Created on {new Date(selectedRequest.account_created_at).toLocaleString()}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-700 border-yellow-300">
                                          No Account Yet
                                        </Badge>
                                      )}
                                    </div>
                                    {selectedRequest.status === 'pending' && (
                                      <div className="flex gap-2 pt-4">
                                        <Button
                                          onClick={() => handleApprove(selectedRequest.id)}
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          onClick={() => handleReject(selectedRequest.id)}
                                          variant="destructive"
                                          className="flex-1"
                                        >
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                    {selectedRequest.status === 'approved' && !selectedRequest.user_id && (
                                      <div className="pt-4">
                                        <Button
                                          onClick={() => {
                                            handleOpenCreateAccount(selectedRequest);
                                          }}
                                          className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                          <UserPlus className="w-4 h-4 mr-2" />
                                          Create Account
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </SheetContent>
                            </Sheet>
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(request.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleReject(request.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status === 'approved' && !request.user_id && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenCreateAccount(request)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create Account
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredRequests.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-600">
                      {filterStatus === 'all'
                        ? 'No access requests yet'
                        : `No ${filterStatus} requests`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {accountCreationRequest && (
        <CreateAccountModal
          open={createAccountModalOpen}
          onOpenChange={setCreateAccountModalOpen}
          request={{
            id: accountCreationRequest.id,
            full_name: accountCreationRequest.full_name,
            email: accountCreationRequest.email,
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </>
  );
}
