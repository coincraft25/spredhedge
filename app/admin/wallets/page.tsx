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
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

export default function AdminWallets() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<any[]>([]);
  const [newWallet, setNewWallet] = useState({
    label: '',
    chain: '',
    address: '',
    explorer_url: '',
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
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true });

    if (data) setWallets(data);
  };

  const handleAdd = async () => {
    if (!newWallet.label || !newWallet.chain || !newWallet.address) {
      toast({
        title: 'Validation Error',
        description: 'Label, chain, and address are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('wallets').insert([
        {
          label: newWallet.label,
          chain: newWallet.chain,
          address: newWallet.address,
          explorer_url: newWallet.explorer_url,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Wallet added',
        description: 'Wallet address has been added',
      });

      setNewWallet({ label: '', chain: '', address: '', explorer_url: '' });
      await loadData();
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to add wallet',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wallet?')) return;

    try {
      const { error } = await supabase.from('wallets').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Wallet deleted',
      });

      await loadData();
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete wallet',
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
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Wallets</h1>
              <p className="text-slate-600">Manage transparency wallet addresses</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Add New Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="label">Label</Label>
                    <Input
                      id="label"
                      value={newWallet.label}
                      onChange={(e) =>
                        setNewWallet({ ...newWallet, label: e.target.value })
                      }
                      placeholder="Primary Reserve"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chain">Chain</Label>
                    <Input
                      id="chain"
                      value={newWallet.chain}
                      onChange={(e) =>
                        setNewWallet({ ...newWallet, chain: e.target.value })
                      }
                      placeholder="Ethereum"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newWallet.address}
                    onChange={(e) =>
                      setNewWallet({ ...newWallet, address: e.target.value })
                    }
                    placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="explorer_url">Explorer URL (Optional)</Label>
                  <Input
                    id="explorer_url"
                    value={newWallet.explorer_url}
                    onChange={(e) =>
                      setNewWallet({ ...newWallet, explorer_url: e.target.value })
                    }
                    placeholder="https://etherscan.io/address/0x..."
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleAdd}>Add Wallet</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Wallets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Chain</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.map((wallet) => (
                      <TableRow key={wallet.id}>
                        <TableCell className="font-medium">{wallet.label}</TableCell>
                        <TableCell>{wallet.chain}</TableCell>
                        <TableCell>
                          <code className="text-sm text-slate-700">{wallet.address}</code>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(wallet.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {wallets.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-600">No wallets yet</p>
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
