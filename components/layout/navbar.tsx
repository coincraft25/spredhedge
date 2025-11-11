'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { signOut } from '@/lib/supabase/auth';
import { useToast } from '@/hooks/use-toast';

interface NavbarProps {
  userRole?: 'admin' | 'investor';
}

export function Navbar({ userRole }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const isPublic = pathname === '/' || pathname === '/request-access' || pathname === '/login' || pathname === '/q3-portfolio' || pathname === '/hedging-philosophy' || pathname?.startsWith('/blog');

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    } else {
      router.push('/');
      toast({
        title: 'Signed out successfully',
      });
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href={isPublic ? '/' : '/dashboard'}>
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-6">
            {isPublic ? (
              <>
                <Link href="/#about" className="text-sm text-slate-600 hover:text-slate-900">
                  About
                </Link>
                <Link href="/hedging-philosophy" className="text-sm text-slate-600 hover:text-slate-900">
                  Philosophy
                </Link>
                <Link href="/blog" className="text-sm text-slate-600 hover:text-slate-900">
                  The Edge
                </Link>
                <Link href="/q3-portfolio" className="text-sm text-slate-600 hover:text-slate-900">
                  Portfolio
                </Link>
                <div className="flex items-center gap-3">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Partner Login
                    </Button>
                  </Link>
                  <Link href="/request-access">
                    <Button variant="default" size="sm">
                      Request Access
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
                  Home
                </Link>
                {userRole === 'admin' && (
                  <Link
                    href="/admin/investors"
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    Admin
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
