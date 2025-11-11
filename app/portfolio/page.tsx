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
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

export default function Portfolio() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'investor'>('investor');
  const [allocations, setAllocations] = useState<any[]>([]);

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
      .from('allocations')
      .select('*')
      .order('allocation_pct', { ascending: false });

    if (data) setAllocations(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const defaultAllocations = [
    {
      category: 'Digital Reserve',
      allocation_pct: 40,
      description: 'Core treasury holdings in established digital assets',
      thesis: 'Bitcoin and Ethereum provide liquid, established digital reserve assets with proven track records.',
    },
    {
      category: 'Structured Yield Layer',
      allocation_pct: 25,
      description: 'High-grade yield generation across DeFi protocols',
      thesis: 'Diversified exposure to battle-tested lending protocols and stablecoin yields.',
    },
    {
      category: 'Strategic Ventures',
      allocation_pct: 20,
      description: 'Thematic allocations with asymmetric upside',
      thesis: 'Selective positions in emerging L1/L2 infrastructure and DeFi primitives.',
    },
    {
      category: 'Liquidity Buffer',
      allocation_pct: 15,
      description: 'Stablecoins for operational flexibility',
      thesis: 'USDC and USDT reserves for redemptions and opportunistic deployment.',
    },
  ];

  const displayAllocations = allocations.length > 0 ? allocations : defaultAllocations;

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="flex">
        <Sidebar role={userRole} />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Allocation Structure</h1>
              <p className="text-slate-600">Current allocation framework and strategic rationale</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Allocation Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Allocation</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayAllocations.map((allocation) => (
                      <TableRow key={allocation.category}>
                        <TableCell className="font-medium">{allocation.category}</TableCell>
                        <TableCell>{allocation.allocation_pct}%</TableCell>
                        <TableCell className="max-w-md text-slate-600">
                          {allocation.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategic Framework</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {displayAllocations.map((allocation) => (
                    <div key={allocation.category} className="border-l-4 border-blue-600 pl-4">
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {allocation.category}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {allocation.thesis || allocation.description}
                      </p>
                    </div>
                  ))}
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
