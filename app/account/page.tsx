'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
} from 'lucide-react';

interface CapitalAccount {
  id: string;
  initial_investment: number;
  current_balance: number;
  current_nav: number;
  shares: number;
  inception_date: string;
  status: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  transaction_date: string;
  status: string;
  notes: string;
}

interface NavHistory {
  date: string;
  nav_value: number;
  nav_per_share: number;
}

export default function InvestorAccount() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'investor'>('investor');
  const [account, setAccount] = useState<CapitalAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [navHistory, setNavHistory] = useState<NavHistory[]>([]);

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

    if (role === 'investor') {
      await loadInvestorData(user.id);
    }

    setLoading(false);
  };

  const loadInvestorData = async (userId: string) => {
    const { data: investorData } = await supabase
      .from('investors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!investorData) return;

    const { data: accountData } = await supabase
      .from('capital_accounts')
      .select('*')
      .eq('investor_id', investorData.id)
      .single();

    if (accountData) {
      setAccount(accountData);

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('capital_account_id', accountData.id)
        .order('transaction_date', { ascending: false });

      if (transactionsData) setTransactions(transactionsData);

      const { data: navData } = await supabase
        .from('investor_nav_history')
        .select('*')
        .eq('capital_account_id', accountData.id)
        .order('date', { ascending: false })
        .limit(12);

      if (navData) setNavHistory(navData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateReturn = () => {
    if (!account) return { returnValue: 0, returnPercent: 0 };
    const returnValue = account.current_nav - account.initial_investment;
    const returnPercent = (returnValue / account.initial_investment) * 100;
    return { returnValue, returnPercent };
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'distribution':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'fee':
        return <DollarSign className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <>
        <Navbar userRole={userRole} />
        <div className="flex">
          <Sidebar role={userRole} />
          <main className="flex-1 p-8 bg-white">
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardContent className="p-12 text-center">
                  <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                    No Capital Account Found
                  </h2>
                  <p className="text-slate-600">
                    Your capital account is being set up. Please contact your administrator
                    for more information.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </>
    );
  }

  const { returnValue, returnPercent } = calculateReturn();

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="flex">
        <Sidebar role={userRole} />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">My Account</h1>
              <p className="text-slate-600">View your capital account and transaction history</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Current NAV
                  </CardTitle>
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {formatCurrency(account.current_nav)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Total Return
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-3xl font-bold ${
                      returnValue >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(returnValue)}
                  </div>
                  <p className={`text-sm ${returnValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {returnPercent >= 0 ? '+' : ''}
                    {returnPercent.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Shares</CardTitle>
                  <Activity className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {account.shares.toFixed(4)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Since Inception
                  </CardTitle>
                  <Calendar className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-slate-900">
                    {new Date(account.inception_date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <p className="text-sm text-slate-500">
                    {Math.floor(
                      (new Date().getTime() - new Date(account.inception_date).getTime()) /
                        (1000 * 60 * 60 * 24 * 30)
                    )}{' '}
                    months
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Initial Allocation</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(account.initial_investment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Current Balance</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(account.current_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Account Status</p>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        account.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">NAV Per Share</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(account.current_nav / account.shares)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {navHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>NAV History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>NAV Value</TableHead>
                        <TableHead>NAV Per Share</TableHead>
                        <TableHead>Shares</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {navHistory.map((record) => (
                        <TableRow key={record.date}>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(record.nav_value)}
                          </TableCell>
                          <TableCell>{formatCurrency(record.nav_per_share)}</TableCell>
                          <TableCell>{record.nav_value / record.nav_per_share}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
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
                          <TableCell className="font-medium">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <footer className="text-center text-sm text-slate-500 pt-8 border-t">
              Confidential. For qualified partners only.
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}
