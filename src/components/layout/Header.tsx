'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HypeConnectLogo } from '@/components/icons';
import { LayoutDashboard, Info, Mail, Video, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from 'lucide-react';

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();

  const mainNavLinks = [
    { href: "/#events", label: "Events"},
    { href: "/about", label: "About"},
    { href: "/contact", label: "Contact"},
    { href: "/book-video-hype", label: "Book a Video"},
  ];

  const mobileNavLinks = [
    { href: "/", label: "Home", icon: Home },
    ...mainNavLinks.map(link => ({...link, icon: Info})), // Placeholder icons
    { href: "/dashboard", label: "Hypeman Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/user", label: "User Dashboard", icon: User },
  ]
  
  const isHomePage = pathname === '/';
  const headerClasses = isHomePage
    ? "absolute top-0 z-50 w-full bg-transparent"
    : "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60";
  const navItemClasses = isHomePage ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground";

  return (
    <header className={cn(headerClasses, className)}>
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <HypeConnectLogo className="h-10 w-10 neon-glow-primary" />
            <span className={cn("font-bold text-xl font-headline", isHomePage && "text-white")}>HypeConnect</span>
          </Link>
        </div>
         <nav className="hidden md:flex items-center gap-2">
             {mainNavLinks.map(link => (
                 <Button key={link.href} variant="ghost" asChild className={navItemClasses}>
                    <Link href={link.href}>
                        {link.label}
                    </Link>
                </Button>
            ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" asChild className={cn(navItemClasses, 'hidden sm:flex')}>
              <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Hypeman
              </Link>
            </Button>
            <Button asChild className='glowing-btn'>
              <Link href="/dashboard/user">
                  <User className="mr-2 h-4 w-4" />
                  Spotlight
              </Link>
            </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("md:hidden p-2 h-10 w-10", navItemClasses)}>
                <Menu className="h-7 w-7" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-sm p-0">
                <SheetHeader className="p-4">
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                </SheetHeader>
               <div className="p-4">
                 <Link href="/" className="flex items-center gap-2 mb-8">
                  <HypeConnectLogo className="h-10 w-10 text-primary neon-glow-primary" />
                  <span className="font-bold text-xl font-headline text-foreground">HypeConnect</span>
                </Link>

                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-4">
                      {mobileNavLinks.map(link => (
                        <Link key={link.href} href={link.href} className="flex items-center gap-4 rounded-lg px-4 py-4 text-xl font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
                          <link.icon className="h-7 w-7" />
                          <span>{link.label}</span>
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}