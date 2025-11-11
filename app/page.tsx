'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/layout/navbar';
import { Shield, TrendingUp, Eye, DollarSign, Lock, BarChart3, FileCheck, CheckCircle2, Network, Award, Layers, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase/client';

interface NavDataPoint {
  month: string;
  value: number;
}

interface Metrics {
  aum: string;
  six_month_return: string;
  max_drawdown: string;
  sharpe_ratio: string;
}

export default function Home() {
  const [navData, setNavData] = useState<NavDataPoint[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    aum: '$12.4M',
    six_month_return: '+24.3%',
    max_drawdown: '-2.9%',
    sharpe_ratio: '1.42'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, navRes] = await Promise.all([
        supabase.from('homepage_metrics').select('*'),
        supabase.from('nav_data_points').select('*').order('display_order')
      ]);

      if (metricsRes.data) {
        const metricsObj: any = {};
        metricsRes.data.forEach((m: any) => {
          metricsObj[m.metric_key] = m.metric_value;
        });
        setMetrics(metricsObj);
      }

      if (navRes.data) {
        setNavData(navRes.data.map((d: any) => ({
          month: d.month,
          value: parseFloat(d.value)
        })));
      }
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Navbar />
      <div className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
          <div className="container mx-auto px-6 py-32 text-center relative">
            <div className="inline-block mb-6">
              <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase px-4 py-2 bg-blue-50 rounded-full">
                Invite Only
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6">
              SpredHedge
            </h1>
            <p className="text-3xl text-slate-600 mb-6 font-light">
              Structured Framework. Strategic Positioning.
            </p>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              A private digital capital structure focused on preservation, disciplined allocation,
              and strategic positioning. Transparent, methodical, member-first.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/request-access">
                <Button size="lg" className="text-base px-8 py-6 shadow-lg">
                  Request Access
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base px-8 py-6">
                  Partner Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 border-t">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-16">
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-slate-400" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900 mb-1">{metrics.aum}</p>
                  )}
                  <p className="text-sm text-slate-600 font-medium">Representative Capital</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-slate-400" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900 mb-1">{metrics.six_month_return}</p>
                  )}
                  <p className="text-sm text-slate-600 font-medium">6-Month Net Activity</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-slate-400" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900 mb-1">{metrics.max_drawdown}</p>
                  )}
                  <p className="text-sm text-slate-600 font-medium">Max Drawdown</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-slate-400" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900 mb-1">{metrics.sharpe_ratio}</p>
                  )}
                  <p className="text-sm text-slate-600 font-medium">Sharpe Ratio</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                NAV Progress
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                SPREDHEDGE has observed <span className="font-semibold text-green-600">{metrics.six_month_return} activity over 6 months</span> with a stable liquidity buffer and disciplined allocation framework.
              </p>
            </div>
            <Card className="max-w-4xl mx-auto border-none shadow-lg">
              <CardContent className="p-8">
                {loading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : navData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-slate-500">
                    No data available
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={navData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      domain={[98, 116]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}`, 'NAV']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                )}
                <p className="text-center text-sm text-slate-500 mt-4">
                  Cumulative NAV Performance (May - October 2024)
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="about" className="bg-slate-50 py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Capital Management Framework
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Four pillars designed to structure capital allocation while
                maintaining preservation principles and liquidity.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-none shadow-sm hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Digital Reserve
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm mb-4">
                    Core treasury holdings in established digital assets (BTC, ETH) providing
                    foundational exposure and liquidity.
                  </p>
                  <p className="text-2xl font-bold text-blue-600">40%</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Structured Yield
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm mb-4">
                    High-grade yield generation through battle-tested DeFi protocols and
                    stablecoin strategies.
                  </p>
                  <p className="text-2xl font-bold text-green-600">25%</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Strategic Ventures
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm mb-4">
                    Selective thematic allocations in emerging infrastructure with
                    asymmetric upside potential.
                  </p>
                  <p className="text-2xl font-bold text-amber-600">20%</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Liquidity Buffer
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm mb-4">
                    Stablecoin reserves ensuring operational flexibility and tactical
                    deployment capacity.
                  </p>
                  <p className="text-2xl font-bold text-slate-600">15%</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Access Process
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                A simple, transparent pathway from inquiry to partner portal access.
              </p>
            </div>
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8">
                <div className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 relative z-10">
                      <span className="text-2xl font-bold text-white">1</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Request Access
                    </h3>
                    <p className="text-sm text-slate-600">
                      Submit your inquiry through our secure form
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 relative z-10">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Due Diligence Review
                    </h3>
                    <p className="text-sm text-slate-600">
                      We review your profile and investment objectives
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 relative z-10">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Agreement & Allocation
                    </h3>
                    <p className="text-sm text-slate-600">
                      Complete documentation and fund your allocation
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 relative z-10">
                      <span className="text-2xl font-bold text-white">4</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Portal Access
                    </h3>
                    <p className="text-sm text-slate-600">
                      Gain full access to your partner dashboard
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center mt-12">
                <Link href="/request-access">
                  <Button size="lg" className="text-base px-8 py-6">
                    Apply Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Why SPREDHEDGE
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                A modern approach to digital capital management, built for qualified partners.
              </p>
            </div>
            <Card className="max-w-5xl mx-auto border-none shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-100">
                        <th className="text-left p-6 text-slate-900 font-semibold">Feature</th>
                        <th className="text-center p-6 text-slate-900 font-semibold">Traditional Structure</th>
                        <th className="text-center p-6 text-blue-600 font-semibold">SPREDHEDGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <Eye className="h-5 w-5 text-slate-600" />
                            <span className="font-medium text-slate-900">Transparency</span>
                          </div>
                        </td>
                        <td className="p-6 text-center text-slate-600">Limited</td>
                        <td className="p-6 text-center">
                          <span className="inline-flex items-center gap-2 text-blue-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Wallet-level visibility
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <Layers className="h-5 w-5 text-slate-600" />
                            <span className="font-medium text-slate-900">Yield Source</span>
                          </div>
                        </td>
                        <td className="p-6 text-center text-slate-600">Single</td>
                        <td className="p-6 text-center">
                          <span className="inline-flex items-center gap-2 text-blue-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Multi-layer hybrid
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <Network className="h-5 w-5 text-slate-600" />
                            <span className="font-medium text-slate-900">Access</span>
                          </div>
                        </td>
                        <td className="p-6 text-center text-slate-600">Institutional</td>
                        <td className="p-6 text-center">
                          <span className="inline-flex items-center gap-2 text-blue-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Private invitation
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-slate-600" />
                            <span className="font-medium text-slate-900">Liquidity</span>
                          </div>
                        </td>
                        <td className="p-6 text-center text-slate-600">Restricted</td>
                        <td className="p-6 text-center">
                          <span className="inline-flex items-center gap-2 text-blue-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Structured lockups
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-slate-600" />
                            <span className="font-medium text-slate-900">Alignment</span>
                          </div>
                        </td>
                        <td className="p-6 text-center text-slate-600">Fixed fees</td>
                        <td className="p-6 text-center">
                          <span className="inline-flex items-center gap-2 text-blue-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Performance-linked
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-24 bg-white border-t">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Award className="h-16 w-16 text-blue-600 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-slate-900 mb-4">
                  Founded by Blueprint X
                </h2>
              </div>
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <p className="text-xl text-slate-700 leading-relaxed mb-6">
                    "8 years in digital markets. Focused on structured frameworks, treasury management, and disciplined positioning."
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Blueprint X brings institutional-grade discipline to digital capital structuring,
                    combining deep market expertise with a commitment to transparency and
                    methodical allocation. Our approach is built on years of navigating volatile
                    markets while maintaining capital preservation as the cornerstone principle.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Access Private Digital Capital Management
            </h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              SpredHedge is accessible exclusively by private invitation to qualified
              participants. Minimum participation: $2,500.
            </p>
            <Link href="/request-access">
              <Button size="lg" variant="secondary" className="text-base px-8 py-6">
                Request Access
              </Button>
            </Link>
          </div>
        </section>

        <section className="bg-slate-50 py-16 border-t">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-slate-200 rounded-lg p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Risk Disclosure
                </h3>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    <strong>Capital at risk.</strong> Digital assets are highly volatile and may result in
                    substantial or complete loss of capital. Past performance is not indicative of future results.
                  </p>
                  <p>
                    <strong>Private structure.</strong> This site is informational and does not constitute
                    an offer or solicitation. Access to SPREDHEDGE is by private invitation only and
                    limited to qualified participants.
                  </p>
                  <p>
                    <strong>Important notice.</strong> Digital asset participation may not be suitable for
                    all individuals. You should carefully consider your financial situation and consult with
                    qualified advisors before making allocation decisions.
                  </p>
                  <p className="text-xs text-slate-500 pt-2 border-t">
                    By accessing this site, you acknowledge that you have read and understood these
                    disclosures and that you are accessing this information in a jurisdiction where
                    such access is permitted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t py-12 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">SpredHedge</h3>
                <p className="text-sm text-slate-600">
                  Private digital capital management for qualified partners.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Contact</h3>
                <p className="text-sm text-slate-600">invest@spredhedge.io</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Legal</h3>
                <p className="text-sm text-slate-600">
                  This material is confidential and intended for qualified investors only.
                </p>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-xs text-slate-500">
              <p>
                © 2024 SpredHedge. All rights reserved. This site is for informational purposes only and does not constitute an offer or solicitation. Past activity is not indicative of future results.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
