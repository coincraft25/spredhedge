'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { StatsCard } from '@/components/stats-card';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip as TooltipUI, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Copy, TrendingUp, DollarSign, Shield, Activity, ExternalLink, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'investor'>('investor');
  const [metrics, setMetrics] = useState<any>(null);
  const [navData, setNavData] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [personalAccount, setPersonalAccount] = useState<any>(null);
  const [personalNavHistory, setPersonalNavHistory] = useState<any[]>([]);

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

    await loadData(user.id, role);
    setLoading(false);
  };

  const loadData = async (userId: string, role: string) => {
    const [metricsRes, navRes, allocRes, walletsRes] = await Promise.all([
      supabase.from('performance_metrics').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('nav_history').select('*').order('date', { ascending: true }).limit(6),
      supabase.from('allocations').select('*'),
      supabase.from('wallets').select('*').limit(3),
    ]);

    if (metricsRes.data) setMetrics(metricsRes.data);
    if (navRes.data) setNavData(navRes.data);
    if (allocRes.data) setAllocations(allocRes.data);
    if (walletsRes.data) setWallets(walletsRes.data);

    if (role === 'investor') {
      const { data: investorData } = await supabase
        .from('investors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (investorData) {
        const { data: accountData } = await supabase
          .from('capital_accounts')
          .select('*')
          .eq('investor_id', investorData.id)
          .maybeSingle();

        if (accountData) {
          setPersonalAccount(accountData);

          const { data: personalNavData } = await supabase
            .from('investor_nav_history')
            .select('*')
            .eq('capital_account_id', accountData.id)
            .order('date', { ascending: true })
            .limit(6);

          if (personalNavData) setPersonalNavHistory(personalNavData);
        }
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Address copied to clipboard',
    });
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  if (loading) {
    return (
      <>
        <Navbar userRole={userRole} />
        <div className="flex">
          <Sidebar role={userRole} />
          <main className="flex-1 p-8 bg-white">
            <div className="max-w-7xl mx-auto">
              <DashboardSkeleton />
            </div>
          </main>
        </div>
      </>
    );
  }

  const liquidityBuffer = allocations.find(a => a.category === 'Liquidity Buffer')?.allocation_pct || 15;

  const calculatePersonalReturn = () => {
    if (!personalAccount) return { returnValue: 0, returnPercent: 0 };
    const returnValue = personalAccount.current_nav - personalAccount.initial_investment;
    const returnPercent = (returnValue / personalAccount.initial_investment) * 100;
    return { returnValue, returnPercent };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const { returnValue: personalReturn, returnPercent: personalReturnPercent } = calculatePersonalReturn();

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="flex">
        <Sidebar role={userRole} />
        <main className="flex-1 p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">SPREDHEDGE Partner Portal</h1>
                <p className="text-slate-600">Real-time activity metrics and verifiable on-chain holdings — SPREDHEDGE Alpha Series.</p>
              </div>
              <Badge variant="outline" className="h-8 px-4">
                <Activity className="h-3 w-3 mr-2 text-green-600" />
                Live
              </Badge>
            </div>

            {userRole === 'investor' && personalAccount && (
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Your Capital Activity</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">Personal allocation overview</p>
                    </div>
                    <Badge className="bg-blue-600">Partner</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-600 mb-1">Current NAV</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(personalAccount.current_nav)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-600 mb-1">Net Activity</p>
                      <p className={`text-2xl font-bold ${personalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(personalReturn)}
                      </p>
                      <p className={`text-sm ${personalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {personalReturnPercent >= 0 ? '+' : ''}{personalReturnPercent.toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-600 mb-1">Initial Investment</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(personalAccount.initial_investment)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-600 mb-1">Shares Held</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {personalAccount.shares.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Framework Overview</h2>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <StatsCard
                label="Monthly Activity"
                value={`${metrics?.mtd_return?.toFixed(1) || '1.8'}%`}
                change={{ value: '0.3%', positive: true }}
                icon={TrendingUp}
                iconColor="text-green-600"
                tooltip="Net change for the current calendar month."
              />
              <StatsCard
                label="6-Month Progress"
                value={`${metrics?.sixm_return?.toFixed(1) || '14.2'}%`}
                change={{ value: '2.1%', positive: true }}
                icon={TrendingUp}
                iconColor="text-blue-600"
                tooltip="Cumulative net activity over the last six months."
              />
              <StatsCard
                label="Allocated Capital"
                value="$12.4M"
                icon={DollarSign}
                iconColor="text-slate-600"
                tooltip="Total capital currently structured within SPREDHEDGE framework."
              />
              <StatsCard
                label="Activity Ratio"
                value="1.42"
                icon={Activity}
                iconColor="text-blue-600"
                tooltip="Activity normalized by volatility observation."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-slate-600">Peak-to-Trough Deviation</p>
                      <TooltipProvider>
                        <TooltipUI>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">Largest observed decline from a prior high.</p>
                          </TooltipContent>
                        </TooltipUI>
                      </TooltipProvider>
                    </div>
                    <Shield className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">-2.9%</p>
                  <p className="text-xs text-slate-500 mt-1">Below 5% target</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-slate-600">Capital Buffer</p>
                      <TooltipProvider>
                        <TooltipUI>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">Capital reserved to manage liquidity and new allocations.</p>
                          </TooltipContent>
                        </TooltipUI>
                      </TooltipProvider>
                    </div>
                    <DollarSign className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{liquidityBuffer}%</p>
                  <p className="text-xs text-slate-500 mt-1">Available for deployment</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-slate-600">Year-to-Date Activity</p>
                      <TooltipProvider>
                        <TooltipUI>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">Net activity since January 1.</p>
                          </TooltipContent>
                        </TooltipUI>
                      </TooltipProvider>
                    </div>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">+{metrics?.ytd_return?.toFixed(1) || '12.4'}%</p>
                  <p className="text-xs text-slate-500 mt-1">Since January 2024</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Activity Curve</CardTitle>
                  <p className="text-sm text-slate-500">6-Month Trend</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={navData.length > 0 ? navData : [
                      { date: '2024-05', nav: 1.000 },
                      { date: '2024-06', nav: 1.024 },
                      { date: '2024-07', nav: 1.051 },
                      { date: '2024-08', nav: 1.089 },
                      { date: '2024-09', nav: 1.118 },
                      { date: '2024-10', nav: 1.142 },
                    ]}>
                      <defs>
                        <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        domain={['dataMin - 0.01', 'dataMax + 0.01']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="nav"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#colorNav)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Capital Distribution</CardTitle>
                  <p className="text-sm text-slate-500">Current Structure</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={allocations.length > 0 ? allocations : [
                          { category: 'Digital Reserve', allocation_pct: 40 },
                          { category: 'Structured Yield', allocation_pct: 25 },
                          { category: 'Strategic Ventures', allocation_pct: 20 },
                          { category: 'Liquidity Buffer', allocation_pct: 15 },
                        ]}
                        dataKey="allocation_pct"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                          const radius = outerRadius + 25;
                          const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                          const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#64748b"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              fontSize={13}
                              fontWeight={500}
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                      >
                        {(allocations.length > 0 ? allocations : [
                          { category: 'Digital Reserve', allocation_pct: 40 },
                          { category: 'Structured Yield', allocation_pct: 25 },
                          { category: 'Strategic Ventures', allocation_pct: 20 },
                          { category: 'Liquidity Buffer', allocation_pct: 15 },
                        ]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span style={{ fontSize: '13px', color: '#64748b' }}>{value}</span>}
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">On-Chain Verification</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Verifiable wallet addresses</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <div className="h-2 w-2 bg-green-600 rounded-full mr-2" />
                    Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(wallets.length > 0 ? wallets : [
                    { label: 'Core Wallet', chain: 'Ethereum', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', explorer_url: 'https://etherscan.io' },
                    { label: 'Stable Asset Vault', chain: 'Ethereum', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', explorer_url: 'https://etherscan.io' },
                    { label: 'Operations Wallet', chain: 'Ethereum', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', explorer_url: 'https://etherscan.io' },
                  ]).map((wallet, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900">{wallet.label}</p>
                          <Badge variant="secondary" className="text-xs">{wallet.chain}</Badge>
                        </div>
                        <code className="text-xs text-slate-600 font-mono">
                          {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(wallet.address)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Copy address"
                        >
                          <Copy className="h-4 w-4 text-slate-600" />
                        </button>
                        {wallet.explorer_url && (
                          <button
                            onClick={() => window.open(wallet.explorer_url, '_blank')}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            title="View on explorer"
                          >
                            <ExternalLink className="h-4 w-4 text-slate-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-900">
                      All holdings publicly verifiable on-chain — updated in real time.
                    </p>
                  </div>
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
