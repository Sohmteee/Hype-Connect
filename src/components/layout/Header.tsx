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
import { useEffect, useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const mainNavLinks = [
    { href: "/#events", label: "Events"},
    { href: "/about", label: "About"},
    { href: "/contact", label: "Contact"},
    { href: "/book-video-hype", label: "Book a Video"},
    { href: "/dashboard", label: "Hypeman Dashboard"},
    { href: "/dashboard/user", label: "User Dashboard"},
  ];

  const mobileNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#events", label: "Events", icon: Info},
    { href: "/about", label: "About", icon: Info},
    { href: "/contact", label: "Contact", icon: Mail},
    { href: "/book-video-hype", label: "Book a Video", icon: Video},
    { href: "/dashboard", label: "Hypeman Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/user", label: "User Dashboard", icon: User },
  ]
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = pathname === '/';
  
  const headerClasses = cn(
    "sticky top-0 z-50 w-full transition-all duration-300",
    {
      "bg-transparent border-b border-transparent": isHomePage && !isScrolled,
      "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60": !isHomePage || isScrolled
    }
  );

  const navItemClasses = (isHomePage && !isScrolled) ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground";
  const logoTextClasses = (isHomePage && !isScrolled) ? "text-white" : "text-foreground";

  return (
    <header className={cn(headerClasses, className)}>
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <HypeConnectLogo className="h-10 w-10 neon-glow-primary" />
            <span className={cn("font-bold text-xl font-headline", logoTextClasses)}>HypeConnect</span>
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
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("md:hidden p-2 h-12 w-12", navItemClasses)}>
                <Menu className="h-8 w-8" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-sm flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <HypeConnectLogo className="h-8 w-8 text-primary neon-glow-primary" />
                        <span className="font-bold text-xl font-headline text-foreground">HypeConnect Menu</span>
                    </SheetTitle>
                </SheetHeader>
               <ScrollArea className="flex-1">
                 <div className="p-4 space-y-2">
                    {mobileNavLinks.map(link => (
                      <Button
                        key={link.href}
                        variant={pathname === link.href ? 'secondary' : 'ghost'}
                        asChild
                        className="w-full justify-start text-lg h-auto p-4"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link href={link.href} className="flex items-center gap-4">
                          <link.icon className="h-6 w-6" />
                          <span>{link.label}</span>
                        </Link>
                      </Button>
                    ))}
                </div>
               </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
