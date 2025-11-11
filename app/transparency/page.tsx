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
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Transparency() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'investor'>('investor');
  const [wallets, setWallets] = useState<any[]>([]);

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
    const { data } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });

    if (data) setWallets(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Address copied to clipboard',
    });
  };

  const maskAddress = (address: string) => {
    if (address.length < 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const defaultWallets = [
    {
      label: 'Primary Reserve',
      chain: 'Ethereum',
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      explorer_url: 'https://etherscan.io/address/0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    },
    {
      label: 'Stablecoin Treasury',
      chain: 'Ethereum',
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      explorer_url: 'https://etherscan.io/address/0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    },
    {
      label: 'Ethereum Ops',
      chain: 'Ethereum',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      explorer_url: 'https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    },
    {
      label: 'DeFi Yield Deployment',
      chain: 'Arbitrum',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      explorer_url: 'https://arbiscan.io/address/0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
  ];

  const displayWallets = wallets.length > 0 ? wallets : defaultWallets;

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="flex">
        <Sidebar role={userRole} />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Transparency</h1>
              <p className="text-slate-600">On-chain wallet addresses and verification</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Structure Wallets</CardTitle>
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
                    {displayWallets.map((wallet, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{wallet.label}</TableCell>
                        <TableCell>{wallet.chain}</TableCell>
                        <TableCell>
                          <code className="text-sm text-slate-700">
                            {maskAddress(wallet.address)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(wallet.address)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {wallet.explorer_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(wallet.explorer_url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Methodology</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Proof of Balances</h3>
                  <p className="text-slate-600 leading-relaxed">
                    All wallet addresses listed above are verified on-chain and can be independently
                    audited using blockchain explorers. Click the external link icon to view any
                    address on its respective block explorer.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Reporting Cadence</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Monthly reconciliation reports include snapshots of all wallet balances as of
                    the last day of each month. These reports are available in the Reports section
                    and include detailed breakdowns of holdings by asset type.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Security</h3>
                  <p className="text-slate-600 leading-relaxed">
                    All structure wallets use multi-signature schemes with institutional custody partners.
                    Private keys are never stored on internet-connected devices and all transactions
                    require multiple authorized signatures.
                  </p>
                </div>
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
