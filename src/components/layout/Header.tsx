import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HypeConnectLogo } from '@/components/icons';
import { LayoutDashboard, LogIn } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <HypeConnectLogo className="h-6 w-6 neon-glow-primary" />
            <span className="font-bold font-headline">HypeConnect</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button className="glowing-btn hidden sm:flex">
             <LogIn className="mr-2 h-4 w-4" />
             Login
          </Button>
        </div>
      </div>
    </header>
  );
}
