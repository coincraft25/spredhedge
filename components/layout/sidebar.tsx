'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  PieChart,
  FileText,
  Eye,
  Settings,
  Users,
  Briefcase,
  TrendingUp,
  Wallet,
  ClipboardList,
  Home,
  User,
  DollarSign,
  CreditCard,
  Target,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  role?: 'admin' | 'investor';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const investorLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/account', label: 'My Account', icon: DollarSign },
    { href: '/portfolio', label: 'Allocations', icon: PieChart },
    { href: '/positions', label: 'Holdings', icon: Target },
    { href: '/reports', label: 'Reports', icon: FileText },
    { href: '/transparency', label: 'Transparency', icon: Eye },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminLinks = [
    { href: '/admin/investors', label: 'Partners', icon: Users },
    { href: '/admin/capital-accounts', label: 'Allocations', icon: CreditCard },
    { href: '/admin/transactions', label: 'Activity Log', icon: DollarSign },
    { href: '/admin/portfolio', label: 'Strategy Builder', icon: PieChart },
    { href: '/admin/positions', label: 'Position Manager', icon: Target },
    { href: '/admin/allocations', label: 'Distribution', icon: Briefcase },
    { href: '/admin/performance', label: 'Analytics', icon: TrendingUp },
    { href: '/admin/blog', label: 'Blog Management', icon: BookOpen },
    { href: '/admin/reports', label: 'Transparency Reports', icon: FileText },
    { href: '/admin/wallets', label: 'On-Chain Wallets', icon: Wallet },
    { href: '/admin/requests', label: 'Support', icon: ClipboardList },
    { href: '/admin/homepage', label: 'Portal Settings', icon: Home },
  ];

  const links = role === 'admin' ? adminLinks : investorLinks;

  return (
    <aside className="w-64 border-r bg-slate-50 min-h-[calc(100vh-73px)]">
      <nav className="p-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
