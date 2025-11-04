
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HypeConnectLogo } from '@/components/icons';
import { LayoutDashboard, LogIn, Info, Mail, Video } from 'lucide-react';
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
  const navLinks = [
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact", icon: Mail },
    { href: "/book-video-hype", label: "Book a Video", icon: Video },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

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
             {navLinks.slice(0, 3).map(link => (
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
              <Button variant="ghost" size="icon" className={cn("md:hidden p-2 h-10 w-10", navItemClasses)}>
                <Menu className="h-7 w-7" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-sm">
                <SheetHeader>
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                </SheetHeader>
               <div className="p-4">
                 <Link href="/" className="flex items-center gap-2 mb-8">
                  <HypeConnectLogo className="h-10 w-10 text-primary neon-glow-primary" />
                  <span className="font-bold text-xl font-headline text-foreground">HypeConnect</span>
                </Link>

                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-4">
                      {navLinks.map(link => (
                        <Link key={link.href} href={link.href} className="flex items-center gap-4 rounded-lg px-4 py-4 text-xl font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
                          <link.icon className="h-7 w-7" />
                          <span>{link.label}</span>
                        </Link>
                      ))}
                  </div>
                  <div className="mt-16 flex flex-col gap-4">
                    <Button size="lg" className="glowing-btn w-full text-lg py-6">
                      <LogIn className="mr-2 h-6 w-6" />
                      Login
                    </Button>
                    <Button size="lg" variant="outline" className="w-full text-lg py-6" asChild>
                       <Link href="/signup">Sign Up</Link>
                    </Button>
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
