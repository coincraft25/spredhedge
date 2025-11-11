'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CapitalAccount {
  id: string;
  investor_id: string;
  initial_investment: number;
  current_balance: number;
  current_nav: number;
  shares: number;
  inception_date: string;
  status: string;
  investor?: {
    full_name: string;
    email: string;
  };
}

interface Investor {
  id: string;
  full_name: string;
  email: string;
}

export default function AdminCapitalAccounts() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<CapitalAccount[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CapitalAccount | null>(null);
  const [formData, setFormData] = useState({
    investor_id: '',
    initial_investment: '',
    current_balance: '',
    current_nav: '',
    shares: '',
    inception_date: new Date().toISOString().split('T')[0],
    status: 'active',
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
    const { data: accountsData } = await supabase
      .from('capital_accounts')
      .select(`
        *,
        investor:investors(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (accountsData) setAccounts(accountsData);

    const { data: investorsData } = await supabase
      .from('investors')
      .select('id, full_name, email')
      .order('full_name');

    if (investorsData) setInvestors(investorsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const accountData = {
      investor_id: formData.investor_id,
      initial_investment: parseFloat(formData.initial_investment),
      current_balance: parseFloat(formData.current_balance),
      current_nav: parseFloat(formData.current_nav),
      shares: parseFloat(formData.shares),
      inception_date: formData.inception_date,
      status: formData.status,
    };

    if (editingAccount) {
      const { error } = await supabase
        .from('capital_accounts')
        .update({ ...accountData, updated_at: new Date().toISOString() })
        .eq('id', editingAccount.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update capital account',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Capital account updated successfully',
      });
    } else {
      const { error } = await supabase
        .from('capital_accounts')
        .insert([accountData]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create capital account',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Capital account created successfully',
      });
    }

    setIsDialogOpen(false);
    setEditingAccount(null);
    resetForm();
    await loadData();
  };

  const handleEdit = (account: CapitalAccount) => {
    setEditingAccount(account);
    setFormData({
      investor_id: account.investor_id,
      initial_investment: account.initial_investment.toString(),
      current_balance: account.current_balance.toString(),
      current_nav: account.current_nav.toString(),
      shares: account.shares.toString(),
      inception_date: account.inception_date,
      status: account.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this capital account?')) return;

    const { error } = await supabase.from('capital_accounts').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete capital account',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Capital account deleted successfully',
    });

    await loadData();
  };

  const resetForm = () => {
    setFormData({
      investor_id: '',
      initial_investment: '',
      current_balance: '',
      current_nav: '',
      shares: '',
      inception_date: new Date().toISOString().split('T')[0],
      status: 'active',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingAccount(null);
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateReturn = (account: CapitalAccount) => {
    const returnValue = account.current_nav - account.initial_investment;
    const returnPercent = (returnValue / account.initial_investment) * 100;
    return { returnValue, returnPercent };
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
        <main className="flex-1 p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Capital Accounts</h1>
                <p className="text-slate-600">Manage investor capital accounts and balances</p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Account
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Capital Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Initial Investment</TableHead>
                      <TableHead>Current NAV</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead>Inception</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      const { returnValue, returnPercent } = calculateReturn(account);
                      return (
                        <TableRow key={account.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{account.investor?.full_name}</p>
                              <p className="text-sm text-slate-500">{account.investor?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(account.initial_investment)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(account.current_nav)}
                          </TableCell>
                          <TableCell>{account.shares.toFixed(4)}</TableCell>
                          <TableCell>
                            <div className={returnValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                              <p className="font-medium">{formatCurrency(returnValue)}</p>
                              <p className="text-sm">{returnPercent.toFixed(2)}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(account.inception_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                account.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : account.status === 'suspended'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {account.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(account)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(account.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {accounts.length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No capital accounts yet</p>
                    <Button onClick={openCreateDialog} className="mt-4">
                      Create First Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Capital Account' : 'Create Capital Account'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? 'Update capital account details'
                : 'Create a new capital account for an investor'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="investor_id">Investor</Label>
                <Select
                  value={formData.investor_id}
                  onValueChange={(value) => setFormData({ ...formData, investor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investor" />
                  </SelectTrigger>
                  <SelectContent>
                    {investors.map((investor) => (
                      <SelectItem key={investor.id} value={investor.id}>
                        {investor.full_name} ({investor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="initial_investment">Initial Investment</Label>
                <Input
                  id="initial_investment"
                  type="number"
                  step="0.01"
                  value={formData.initial_investment}
                  onChange={(e) =>
                    setFormData({ ...formData, initial_investment: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="current_balance">Current Balance</Label>
                <Input
                  id="current_balance"
                  type="number"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={(e) =>
                    setFormData({ ...formData, current_balance: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="current_nav">Current NAV</Label>
                <Input
                  id="current_nav"
                  type="number"
                  step="0.01"
                  value={formData.current_nav}
                  onChange={(e) => setFormData({ ...formData, current_nav: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="shares">Shares</Label>
                <Input
                  id="shares"
                  type="number"
                  step="0.000001"
                  value={formData.shares}
                  onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="inception_date">Inception Date</Label>
                <Input
                  id="inception_date"
                  type="date"
                  value={formData.inception_date}
                  onChange={(e) => setFormData({ ...formData, inception_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingAccount ? 'Update' : 'Create'} Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
