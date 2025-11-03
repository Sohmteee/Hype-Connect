
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HypeConnectLogo } from '@/components/icons';
import { LayoutDashboard, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header({ className }: { className?: string }) {
  return (
    <header className={cn("absolute top-0 z-50 w-full bg-transparent", className)}>
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <HypeConnectLogo className="h-6 w-6 neon-glow-primary" />
            <span className="font-bold font-headline text-white">HypeConnect</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
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
