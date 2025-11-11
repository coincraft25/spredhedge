'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { getVisiblePositions } from '@/lib/supabase/positions';
import { Position } from '@/lib/supabase/types';
import {
  enrichPositionWithCalculations,
  calculatePortfolioSize,
  formatCurrency,
  formatPercentage,
  getStatusColor,
  getPerformanceColor,
} from '@/lib/utils/position-calculations';
import { Search, TrendingUp, TrendingDown, Activity, DollarSign, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

export default function PositionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'investor'>('investor');
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

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

    await loadPositions(role as 'admin' | 'investor');
    setLoading(false);
  };

  const loadPositions = async (role: 'admin' | 'investor') => {
    const data = await getVisiblePositions(role);
    setPositions(data);
    if (data.length > 0) {
      setSelectedPosition(data[0]);
    }
  };

  const filteredPositions = positions.filter(p => {
    const matchesSearch = !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticker?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sectorFilter === 'all' || p.sector === sectorFilter;

    return matchesSearch && matchesSector;
  });

  const sectors = Array.from(new Set(positions.map(p => p.sector).filter(Boolean)));

  const livePositions = positions.filter(p => p.status === 'Live');
  const closedPositions = positions.filter(p => p.status === 'Closed');
  const portfolioSize = calculatePortfolioSize(positions);

  const sectorAllocation = sectors.map(sector => {
    const sectorPositions = livePositions.filter(p => p.sector === sector);
    const totalCost = sectorPositions.reduce((sum, p) => sum + p.cost_basis, 0);
    return {
      name: sector || 'Other',
      value: totalCost,
      percentage: portfolioSize > 0 ? (totalCost / portfolioSize) * 100 : 0,
    };
  }).filter(s => s.value > 0);

  const topPerformers = livePositions
    .map(p => enrichPositionWithCalculations(p))
    .sort((a, b) => b.performance_pct - a.performance_pct)
    .slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <>
        <Navbar userRole={userRole} />
        <div className="flex">
          <Sidebar role={userRole} />
          <main className="flex-1 p-8 bg-[#0f1724] min-h-screen">
            <div className="flex items-center justify-center h-96">
              <p className="text-slate-400">Loading...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  const selectedPositionEnriched = selectedPosition
    ? enrichPositionWithCalculations(selectedPosition)
    : null;

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="flex">
        <Sidebar role={userRole} />
        <main className="flex-1 bg-[#0f1724] min-h-screen">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Position Framework
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Private holdings overview • Partners only
                  </p>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                  <Activity className="h-3 w-3 mr-2" />
                  Live
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-4 max-w-3xl">
                Private holdings overview. Data is for informational and observational purposes only. Not a solicitation or offer.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-3">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">
                      Quick Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Allocated Capital</p>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(portfolioSize, 0)}
                      </p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Active Holdings</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {livePositions.length}
                      </p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Closed Holdings</p>
                      <p className="text-xl font-bold text-blue-400">
                        {closedPositions.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">
                      Position List
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                          placeholder="Search positions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <Select value={sectorFilter} onValueChange={setSectorFilter}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Filter by sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sectors</SelectItem>
                          {sectors.map(sector => (
                            <SelectItem key={sector} value={sector || ''}>
                              {sector}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {filteredPositions.map(position => (
                          <button
                            key={position.id}
                            onClick={() => setSelectedPosition(position)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                              selectedPosition?.id === position.id
                                ? 'bg-emerald-900/30 border border-emerald-700'
                                : 'bg-slate-800 hover:bg-slate-700 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                  {position.title}
                                </p>
                                {position.ticker && (
                                  <p className="text-xs text-emerald-400 font-mono">
                                    {position.ticker}
                                  </p>
                                )}
                              </div>
                              <Badge
                                className={`ml-2 ${getStatusColor(position.status)} text-white text-xs`}
                              >
                                {position.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400">
                              {format(new Date(position.entry_date), 'MMM dd, yyyy')}
                            </p>
                          </button>
                        ))}
                        {filteredPositions.length === 0 && (
                          <p className="text-center text-slate-500 py-8 text-sm">
                            No positions found
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-12 lg:col-span-6">
                {selectedPositionEnriched ? (
                  <div className="space-y-4">
                    <Card className="bg-slate-900 border-slate-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-2xl text-white mb-2">
                              {selectedPositionEnriched.title}
                            </CardTitle>
                            <div className="flex items-center gap-3">
                              {selectedPositionEnriched.ticker && (
                                <Badge variant="outline" className="text-emerald-400 border-emerald-400 font-mono">
                                  {selectedPositionEnriched.ticker}
                                </Badge>
                              )}
                              {selectedPositionEnriched.sector && (
                                <Badge variant="outline" className="text-blue-400 border-blue-400">
                                  {selectedPositionEnriched.sector}
                                </Badge>
                              )}
                              <Badge className={`${getStatusColor(selectedPositionEnriched.status)} text-white`}>
                                {selectedPositionEnriched.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {selectedPositionEnriched.public_note && (
                          <p className="text-slate-300 text-sm mb-6 pb-6 border-b border-slate-800">
                            {selectedPositionEnriched.public_note}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                              Entry Price
                              <Info className="h-3 w-3" />
                            </p>
                            <p className="text-lg font-bold text-white">
                              {formatCurrency(selectedPositionEnriched.entry_price)}
                            </p>
                          </div>

                          <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-400 mb-1">Current Price</p>
                            <p className="text-lg font-bold text-white">
                              {selectedPositionEnriched.market_price
                                ? formatCurrency(selectedPositionEnriched.market_price)
                                : 'N/A'}
                            </p>
                            {selectedPositionEnriched.price_updated_at && (
                              <p className="text-xs text-slate-500 mt-1">
                                as of {format(new Date(selectedPositionEnriched.price_updated_at), 'MMM dd')}
                              </p>
                            )}
                          </div>

                          <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-400 mb-1">Quantity</p>
                            <p className="text-lg font-bold text-white">
                              {selectedPositionEnriched.quantity.toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-400 mb-1">Position Activity</p>
                            <p className={`text-lg font-bold ${getPerformanceColor(selectedPositionEnriched.performance_pct)}`}>
                              {formatPercentage(selectedPositionEnriched.performance_pct)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-400 mb-1">Cost Basis</p>
                            <p className="text-base font-semibold text-white">
                              {formatCurrency(selectedPositionEnriched.cost_basis)}
                            </p>
                          </div>

                          {selectedPositionEnriched.status === 'Live' && selectedPositionEnriched.market_price && (
                            <div className="bg-slate-800 rounded-lg p-4">
                              <p className="text-xs text-slate-400 mb-1">Current Variance</p>
                              <p className={`text-base font-semibold ${getPerformanceColor(selectedPositionEnriched.unrealized_pnl)}`}>
                                {formatCurrency(selectedPositionEnriched.unrealized_pnl)}
                              </p>
                            </div>
                          )}

                          {selectedPositionEnriched.status === 'Closed' && selectedPositionEnriched.realized_pnl && (
                            <div className="bg-slate-800 rounded-lg p-4">
                              <p className="text-xs text-slate-400 mb-1">Closed Position Result</p>
                              <p className={`text-base font-semibold ${getPerformanceColor(selectedPositionEnriched.realized_pnl)}`}>
                                {formatCurrency(selectedPositionEnriched.realized_pnl)}
                              </p>
                            </div>
                          )}

                          <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-400 mb-1">Days Held</p>
                            <p className="text-base font-semibold text-white">
                              {selectedPositionEnriched.days_held}
                            </p>
                          </div>
                        </div>

                        {selectedPositionEnriched.target_price && (
                          <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-blue-400 mb-1">Observation Level</p>
                                <p className="text-lg font-bold text-white">
                                  {formatCurrency(selectedPositionEnriched.target_price)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Differential</p>
                                <p className="text-lg font-bold text-blue-400">
                                  {formatPercentage(
                                    ((selectedPositionEnriched.target_price / selectedPositionEnriched.entry_price) - 1) * 100
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedPositionEnriched.tags && selectedPositionEnriched.tags.length > 0 && (
                          <div className="mt-6">
                            <p className="text-xs text-slate-400 mb-2">Tags</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedPositionEnriched.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-slate-300 border-slate-700">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">Position Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <div>
                              <p className="text-sm text-white">Entry</p>
                              <p className="text-xs text-slate-400">
                                {format(new Date(selectedPositionEnriched.entry_date), 'MMM dd, yyyy')} • {formatCurrency(selectedPositionEnriched.entry_price)}
                              </p>
                            </div>
                          </div>

                          {selectedPositionEnriched.closing_date && (
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <div>
                                <p className="text-sm text-white">Closed</p>
                                <p className="text-xs text-slate-400">
                                  {format(new Date(selectedPositionEnriched.closing_date), 'MMM dd, yyyy')} • {formatCurrency(selectedPositionEnriched.closing_price || 0)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-20">
                      <p className="text-center text-slate-500">
                        Select a position to view details
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="col-span-12 lg:col-span-3">
                <div className="space-y-4">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-slate-300">
                        Allocation by Sector
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sectorAllocation.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={sectorAllocation}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                              {sectorAllocation.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => formatCurrency(value)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-slate-500 py-8 text-sm">
                          No data available
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-slate-300">
                        Notable Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {topPerformers.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={topPerformers} layout="vertical">
                            <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                            <YAxis
                              type="category"
                              dataKey="ticker"
                              stroke="#64748b"
                              tick={{ fontSize: 10 }}
                              width={50}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => formatPercentage(value)}
                            />
                            <Bar dataKey="performance_pct" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-slate-500 py-8 text-sm">
                          No data available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
