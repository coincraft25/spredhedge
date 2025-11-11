'use client';

import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, TrendingUp, BarChart3, Target } from 'lucide-react';

export default function HedgingPhilosophy() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16 space-y-24">
          {/* Hero */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
              Why Hedging Bitcoin Matters
            </h1>
            <p className="text-2xl text-slate-600 font-light">
              Bitcoin is the foundation — not the entire fortress.
            </p>
          </div>

          {/* Section 1: The Paradox of Strength */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                The Paradox of Strength
              </h2>
            </div>

            <div className="space-y-6 text-lg leading-relaxed text-slate-700">
              <p>
                Bitcoin is the most secure monetary network ever created.
                It's decentralized, finite, and globally liquid — a superior long-term reserve asset.
              </p>
              <p>
                But its freedom from central control also means price freedom: large, sudden drawdowns
                that can erase short-term gains.
              </p>
              <div className="bg-slate-50 border-l-4 border-slate-900 p-6 my-8">
                <p className="text-xl font-medium text-slate-900 italic">
                  "Traditional wealth compounds through stability, not adrenaline."
                </p>
              </div>
              <p>
                So our job isn't to doubt Bitcoin — it's to engineer around its volatility.
              </p>
            </div>
          </section>

          {/* Section 2: Modern Portfolio */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                The Modern Portfolio, Rebuilt for the Digital Era
              </h2>
            </div>

            <p className="text-lg text-slate-700 leading-relaxed">
              Old-world investors paired gold + bonds + equities.<br />
              We've rebuilt that model in digital form:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="text-left p-4 font-semibold">Layer</th>
                    <th className="text-left p-4 font-semibold">Objective</th>
                    <th className="text-left p-4 font-semibold">Digital Analogue</th>
                    <th className="text-left p-4 font-semibold">Allocation</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-b border-slate-200">
                    <td className="p-4 font-medium">Digital Reserve</td>
                    <td className="p-4">Preserve purchasing power (BTC / ETH)</td>
                    <td className="p-4">Digital Gold</td>
                    <td className="p-4 font-bold text-lg">40%</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-4 font-medium">Structured Yield Layer</td>
                    <td className="p-4">Earn predictable income in all conditions</td>
                    <td className="p-4">Digital Bonds</td>
                    <td className="p-4 font-bold text-lg">25%</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-4 font-medium">Strategic Ventures</td>
                    <td className="p-4">Capture innovation upside (AI / DePIN / Infra)</td>
                    <td className="p-4">Digital Equities</td>
                    <td className="p-4 font-bold text-lg">20%</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-4 font-medium">Liquidity Buffer</td>
                    <td className="p-4">Protect NAV, enable tactical re-entries</td>
                    <td className="p-4">Digital Cash</td>
                    <td className="p-4 font-bold text-lg">15%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-4 text-lg leading-relaxed text-slate-700">
              <p>
                Each layer serves a purpose: preservation, income, growth, flexibility.
              </p>
              <p>
                Together they create what we call <span className="font-semibold text-slate-900">Digital Modern Portfolio Theory</span> —
                a design that endures every cycle rather than chasing the next one.
              </p>
            </div>
          </section>

          {/* Section 3: Data Over Dogma */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                Data Over Dogma
              </h2>
            </div>

            <div className="space-y-6 text-lg leading-relaxed text-slate-700">
              <p>
                Across its history Bitcoin has averaged triple-digit annual returns — and 50%+ drawdowns.
              </p>
              <p>
                Recovering from a –50% fall requires +100% growth just to break even.
                That's why most portfolios fail: they're structurally unprepared for time, not talent.
              </p>
            </div>

            <Card className="bg-slate-900 border-0">
              <CardContent className="p-8 text-white">
                <p className="text-2xl font-bold mb-6">
                  SPREDHEDGE reduces drawdown drag by 60–80%
                </p>
                <p className="text-lg text-slate-300 mb-4">(vs pure BTC exposure) through:</p>
                <ul className="space-y-3 text-lg">
                  <li className="flex items-start">
                    <span className="mr-3">•</span>
                    <span>constant yield accrual (5–7% / yr on stable capital)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3">•</span>
                    <span>uncorrelated tactical positions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3">•</span>
                    <span>disciplined liquidity management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Section 4: The Convex Outcome */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                The Convex Outcome
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-green-900">When Bitcoin rallies</h3>
                  <p className="text-green-800">Our reserve compounds.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-blue-900">When it consolidates</h3>
                  <p className="text-blue-800">Our yield keeps growing.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-200 bg-slate-50">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-slate-900">When it corrects</h3>
                  <p className="text-slate-800">Our hedging layers preserve NAV and let us buy back cheaper.</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-slate-50 p-8 rounded-lg space-y-4 text-lg leading-relaxed text-slate-700">
              <p className="font-semibold text-slate-900 text-xl">
                The result: positive convexity — limited downside, asymmetric upside.
              </p>
              <p>
                It's how disciplined capital quietly outperforms speculative capital over time.
              </p>
            </div>
          </section>

          {/* Section 5: Philosophy */}
          <section className="space-y-8 pb-16">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Our Philosophy in One Line
            </h2>

            <div className="bg-slate-900 p-12 rounded-lg">
              <p className="text-3xl md:text-4xl font-bold text-white text-center leading-relaxed">
                "We don't time Bitcoin cycles — we design systems that survive them."
              </p>
            </div>

            <div className="text-center space-y-4 text-lg leading-relaxed text-slate-700">
              <p>
                That's the essence of SPREDHEDGE:
              </p>
              <p>
                <span className="font-semibold text-slate-900">structured yield</span> for resilience,
                <span className="font-semibold text-slate-900"> strategic exposure</span> for growth,
              </p>
              <p>
                and <span className="font-semibold text-slate-900">digital discipline</span> for a post-Bitcoin financial world.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
