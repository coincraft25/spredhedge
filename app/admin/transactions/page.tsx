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
import { Plus, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  capital_account_id: string;
  type: string;
  amount: number;
  transaction_date: string;
  status: string;
  notes: string;
  capital_account?: {
    investor: {
      full_name: string;
      email: string;
    };
  };
}

interface CapitalAccount {
  id: string;
  investor_id: string;
  investor: {
    full_name: string;
    email: string;
  } | null;
}

export default function AdminTransactions() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<CapitalAccount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    capital_account_id: '',
    type: 'deposit',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    notes: '',
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
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select(`
        *,
        capital_account:capital_accounts(
          investor:investors(full_name, email)
        )
      `)
      .order('transaction_date', { ascending: false });

    if (transactionsData) setTransactions(transactionsData);

    const { data: accountsData } = await supabase
      .from('capital_accounts')
      .select(`
        id,
        investor_id,
        investors!inner(full_name, email)
      `)
      .eq('status', 'active');

    if (accountsData) {
      const formattedAccounts = accountsData.map((account: any) => ({
        id: account.id,
        investor_id: account.investor_id,
        investor: Array.isArray(account.investors) ? account.investors[0] : account.investors,
      }));
      setAccounts(formattedAccounts);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { user } = await getCurrentUser();
    if (!user) return;

    const transactionData = {
      capital_account_id: formData.capital_account_id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
      status: formData.status,
      notes: formData.notes,
      created_by: user.id,
    };

    if (editingTransaction) {
      const { error } = await supabase
        .from('transactions')
        .update({ ...transactionData, updated_at: new Date().toISOString() })
        .eq('id', editingTransaction.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update transaction',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
    } else {
      const { error } = await supabase.from('transactions').insert([transactionData]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create transaction',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Transaction created successfully',
      });
    }

    setIsDialogOpen(false);
    setEditingTransaction(null);
    resetForm();
    await loadData();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      capital_account_id: transaction.capital_account_id,
      type: transaction.type,
      amount: transaction.amount.toString(),
      transaction_date: transaction.transaction_date,
      status: transaction.status,
      notes: transaction.notes,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Transaction deleted successfully',
    });

    await loadData();
  };

  const resetForm = () => {
    setFormData({
      capital_account_id: '',
      type: 'deposit',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      notes: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingTransaction(null);
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpCircle className="h-5 w-5 text-red-600" />;
      case 'distribution':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'fee':
        return <DollarSign className="h-5 w-5 text-orange-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-slate-600" />;
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
        <main className="flex-1 p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Transactions</h1>
                <p className="text-slate-600">Manage investor deposits, withdrawals, and distributions</p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <span className="capitalize">{transaction.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {transaction.capital_account?.investor.full_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {transaction.capital_account?.investor.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {transactions.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No transactions yet</p>
                    <Button onClick={openCreateDialog} className="mt-4">
                      Create First Transaction
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
              {editingTransaction ? 'Edit Transaction' : 'Create Transaction'}
            </DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? 'Update transaction details'
                : 'Record a new deposit, withdrawal, or distribution'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="capital_account_id">Capital Account</Label>
                <Select
                  value={formData.capital_account_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, capital_account_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.investor?.full_name} ({account.investor?.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Transaction Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="transaction_date">Transaction Date</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) =>
                    setFormData({ ...formData, transaction_date: e.target.value })
                  }
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this transaction"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTransaction ? 'Update' : 'Create'} Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
