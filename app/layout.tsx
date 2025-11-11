import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'SpredHedge - Private Digital Capital Management',
  description: 'A private digital capital vehicle focused on preservation, steady income, and macro-aligned growth. Invite-only institutional-grade digital asset management.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'SpredHedge - Private Digital Capital Management',
    description: 'A private digital capital vehicle focused on preservation, steady income, and macro-aligned growth.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
