'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bitcoin, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  description: string;
  observed_return: string;
  display_order: number;
  category_id: string;
}

interface PortfolioCategory {
  id: string;
  name: string;
  purpose: string;
  language_style: string;
  allocation_percentage: number;
  display_order: number;
}

export default function Q3Portfolio() {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const [categoriesRes, holdingsRes] = await Promise.all([
        supabase.from('portfolio_categories').select('*').order('display_order'),
        supabase.from('portfolio_holdings').select('*').order('display_order')
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (holdingsRes.data) setHoldings(holdingsRes.data);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHoldingsByCategory = (categoryId: string) => {
    return holdings.filter(h => h.category_id === categoryId);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <Badge className="mb-6 bg-blue-600 text-white text-sm px-4 py-1">
                Q3 2025 Portfolio Overview
              </Badge>
              <h1 className="text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                Portfolio Architecture
              </h1>
              <p className="text-2xl text-slate-600 max-w-4xl leading-relaxed">
                SPREDHEDGE maintains a multi-layer portfolio built to balance resilience, liquidity, and growth.
                The strategy combines digital monetary reserves, selective innovation exposure, and sovereign yield mechanisms.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 max-w-3xl mx-auto">
              <Card className="border-2 border-slate-200 shadow-sm">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-3">+14.2%</div>
                    <div className="text-base text-slate-600 font-medium">NAV Growth (6 Months)</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 shadow-sm">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-amber-600 mb-3">22%</div>
                    <div className="text-base text-slate-600 font-medium">Liquidity Buffer</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-20">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Performance Distribution Model
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-4xl">
                SPREDHEDGE aligns incentives by rewarding investors first. Our distribution model ensures founders only profit when you profit.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="pt-8 pb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-white">1</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Investors Receive Fixed Yield</h3>
                        <p className="text-slate-700 mb-3">
                          All investors receive a <span className="font-bold text-blue-600">20% annualized yield</span> on their capital allocation, paid quarterly.
                        </p>
                        <p className="text-sm text-slate-600 italic">
                          This fixed return is prioritized before any profit distribution to founders.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="pt-8 pb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-white">2</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Founders Share in Profits Only</h3>
                        <p className="text-slate-700 mb-3">
                          Founders receive <span className="font-bold text-green-600">25% of quarterly net profits</span> after investor yields are paid.
                        </p>
                        <p className="text-sm text-slate-600 italic">
                          The remaining 75% is reinvested to compound fund growth.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 border-slate-300 bg-slate-50">
                <CardContent className="pt-8 pb-8">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 text-center">Profit Distribution Breakdown</h4>
                  <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-blue-600 mb-2">75%</div>
                      <div className="text-sm text-slate-600 font-medium">Reinvested for Fund Growth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-green-600 mb-2">25%</div>
                      <div className="text-sm text-slate-600 font-medium">Founders' Profit Share</div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-500 mt-6 italic">
                    This structure ensures full alignment between founders and investors, with capital preservation as the primary objective.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-20">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Structure Overview
              </h2>
              <p className="text-lg text-slate-600 mb-12 max-w-4xl">
                We separate holdings into three exposure categories, all structured for institutional strategy — not speculation.
              </p>

              <div className="overflow-x-auto mb-16">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
                      <th className="text-left py-4 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">Category</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">Purpose</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">Examples</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">Language Style</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const categoryHoldings = getHoldingsByCategory(category.id);
                      const examples = categoryHoldings.slice(0, 3).map(h => h.symbol).join(', ');

                      return (
                        <tr key={category.id} className="border-b border-slate-200">
                          <td className="py-6 px-4">
                            <div className="font-semibold text-slate-900 text-lg">{category.name}</div>
                            <div className="text-sm text-blue-600 font-medium mt-1">{category.allocation_percentage}% Allocation</div>
                          </td>
                          <td className="py-6 px-4 text-slate-700">{category.purpose}</td>
                          <td className="py-6 px-4">
                            <div className="font-mono text-sm text-slate-900 font-semibold">{examples}</div>
                          </td>
                          <td className="py-6 px-4 text-slate-600 italic">{category.language_style}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {categories.map((category) => {
              const categoryHoldings = getHoldingsByCategory(category.id);

              return (
                <div key={category.id} className="mb-20">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-1 w-12 bg-blue-600"></div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {category.name}
                    </h2>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {category.allocation_percentage}%
                    </Badge>
                  </div>
                  <p className="text-lg text-slate-600 mb-8 max-w-4xl italic">
                    {category.language_style}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryHoldings.map((holding) => (
                      <Card
                        key={holding.id}
                        className="border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
                      >
                        <CardContent className="pt-8 pb-8">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                              {holding.symbol === 'BTC' ? (
                                <Bitcoin className="h-7 w-7 text-orange-500" />
                              ) : (
                                <Coins className="h-7 w-7 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs font-bold text-blue-600 mb-1">
                                {holding.symbol}
                              </div>
                              <h3 className="font-bold text-xl text-slate-900 mb-1 leading-tight">
                                {holding.name}
                              </h3>
                            </div>
                          </div>

                          <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            {holding.description}
                          </p>

                          {holding.observed_return && (
                            <div className="pt-4 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 uppercase tracking-wide">Observed Return</span>
                                <span className="text-lg font-bold text-green-600">{holding.observed_return}</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

            <Card className="bg-slate-900 border-slate-900 shadow-xl">
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-6">
                  <p className="text-xl text-slate-300">
                    All allocations reflect <span className="font-bold text-white">SPREDHEDGE's dual mandate:</span>
                  </p>
                  <p className="text-3xl text-white font-bold">
                    Capital Preservation & Asymmetric Digital Opportunity
                  </p>
                  <div className="flex items-center justify-center gap-12 pt-6">
                    <div>
                      <div className="text-sm text-slate-400 uppercase tracking-wide mb-1">Max Drawdown</div>
                      <div className="text-2xl font-bold text-red-400">-2.9%</div>
                    </div>
                    <div className="h-12 w-px bg-slate-700"></div>
                    <div>
                      <div className="text-sm text-slate-400 uppercase tracking-wide mb-1">Sharpe Ratio</div>
                      <div className="text-2xl font-bold text-blue-400">1.42</div>
                    </div>
                    <div className="h-12 w-px bg-slate-700"></div>
                    <div>
                      <div className="text-sm text-slate-400 uppercase tracking-wide mb-1">Aggregate Performance</div>
                      <div className="text-2xl font-bold text-green-400">+14.2%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
