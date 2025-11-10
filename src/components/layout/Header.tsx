"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HypeSonoveaLogo } from '@/components/icons';
import { LayoutDashboard, Info, Mail, Video, User, Home, LogOut } from 'lucide-react';
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
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { ScrollArea } from '../ui/scroll-area';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userMeta, setUserMeta] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check auth state
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error('Auth state error:', error);
      setLoading(false);
    }
  }, []);

  // Fetch Firestore user doc to get roles / profile info for nav decisions
  useEffect(() => {
    let mounted = true;
    async function loadUserMeta(uid: string) {
      try {
        const ref = doc(firestore, 'users', uid);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) {
          setUserMeta(snap.data());
        } else {
          setUserMeta(null);
        }
      } catch (err) {
        console.error('[Header] failed to load user meta', err);
        setUserMeta(null);
      }
    }

    if (user?.uid) {
      loadUserMeta(user.uid);
    } else {
      setUserMeta(null);
    }

    return () => {
      mounted = false;
    };
  }, [user]);

  // Track client mount to avoid hydration mismatches when using pathname and window
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
      // Redirect to homepage after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  // If the logged-in user is a hypeman, we hide public "Book a Video" link
  const isHypeman = userMeta?.type === "hypeman";
  const isSpotlight = userMeta?.type === "spotlight";

  const mainNavLinks: Array<{ href: string; label: string }> = [
    { href: "/#events", label: "Events" },
    { href: "/about", label: "About" },
    // Only show public booking link when user is not a hypeman
    ...(isHypeman ? [] : [{ href: "/book-video-hype", label: "Book a Video" }]),
  ];

  const mobileNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#events", label: "Events", icon: Info },
    { href: "/about", label: "About", icon: Info },
    // only include booking for non-hypemen
    ...(!isHypeman ? [{ href: "/book-video-hype", label: "Book a Video", icon: Video }] : []),
    ...(user ? [
      // For hypemen, prefer the hypeman dashboard; for spotlight users show a profile link
      ...(isHypeman ? [{ href: "/dashboard", label: "Hypeman Dashboard", icon: LayoutDashboard }] : []),
      ...(isSpotlight ? [{ href: "/profile", label: "Profile", icon: User }] : [{ href: "/dashboard/user", label: "User Dashboard", icon: User }]),
    ] : []),
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Only evaluate pathname-dependent values after mount to keep server and client HTML consistent
  const isHomePage = mounted ? pathname === '/' : false;

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
            <HypeSonoveaLogo className="h-10 w-10 neon-glow-primary" />
            <span className={cn("font-bold text-xl font-headline", logoTextClasses)}>HypeSonovea</span>
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
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {!loading && !user ? (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className={navItemClasses}
                >
                  <Link href="/auth/login">Log In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50"
                >
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            ) : user ? (
              <>
                {/* Primary dashboard link (role-aware label/target) */}
                <Button
                  variant="ghost"
                  asChild
                  className={navItemClasses}
                >
                  {isHypeman ? (
                    <Link href="/dashboard">Hypeman Dashboard</Link>
                  ) : (
                    <Link href="/dashboard/user">Dashboard</Link>
                  )}
                </Button>

                {/* Always-visible Profile/settings link for quick access to account settings */}
                <Button
                  variant="ghost"
                  asChild
                  className={navItemClasses}
                >
                  <Link href="/profile">Profile</Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className={navItemClasses}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </>
            ) : null}
          </div>

          {/* Mobile Menu */}
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
                  <HypeSonoveaLogo className="h-8 w-8 text-primary neon-glow-primary" />
                  <span className="font-bold text-xl font-headline text-foreground">HypeSonovea Menu</span>
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

              {/* Mobile Auth Section */}
              <div className="border-t p-4 space-y-2">
                {!loading && !user ? (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link href="/auth/login">Log In</Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link href="/auth/register">Sign Up</Link>
                    </Button>
                  </>
                ) : user ? (
                  <>
                    <div className="space-y-2">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {isHypeman ? (
                          <Link href="/dashboard">Hypeman Dashboard</Link>
                        ) : (
                          <Link href="/dashboard/user">Dashboard</Link>
                        )}
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        className="w-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link href="/profile">Profile</Link>
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                  </>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
