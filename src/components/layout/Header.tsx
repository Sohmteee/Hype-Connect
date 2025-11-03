
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HypeConnectLogo } from '@/components/icons';
import { LayoutDashboard, LogIn, Info, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from 'lucide-react';

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const navLinks = [
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact", icon: Mail },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const isHomePage = pathname === '/';
  const headerClasses = isHomePage
    ? "absolute top-0 z-50 w-full bg-transparent"
    : "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60";
  const navItemClasses = isHomePage ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground";


  return (
    <header className={cn(headerClasses, className)}>
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <HypeConnectLogo className="h-6 w-6 neon-glow-primary" />
            <span className={cn("font-bold font-headline", isHomePage && "text-white")}>HypeConnect</span>
          </Link>
        </div>
         <nav className="hidden md:flex items-center gap-2">
             {navLinks.slice(0, 2).map(link => (
                 <Button key={link.href} variant="ghost" asChild className={navItemClasses}>
                    <Link href={link.href}>
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                    </Link>
                </Button>
            ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
           <Button variant="ghost" asChild className={cn("hidden sm:flex", navItemClasses)}>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button className="glowing-btn hidden sm:flex">
             <LogIn className="mr-2 h-4 w-4" />
             Login
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("md:hidden", navItemClasses)}>
                <Menu />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex-1 py-8">
                  <div className="flex flex-col gap-4">
                    {navLinks.map(link => (
                      <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <link.icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <Button className="glowing-btn w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
