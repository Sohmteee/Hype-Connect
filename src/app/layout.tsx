import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/layout/Footer';
import { Suspense } from 'react';
import Loading from './loading';

export const metadata: Metadata = {
  title: 'HypeConnect',
  description: 'Send hype to your favorite MCs in real-time!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
          <div className='flex-1'>
            <Suspense fallback={<Loading />}>
              {children}
            </Suspense>
          </div>
          <Footer />
          <Toaster />
      </body>
    </html>
  );
}
