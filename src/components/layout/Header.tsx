'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HypeConnectLogo } from '@/components/icons';
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
import { useUser, useAuth } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';


export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  }

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
           { isUserLoading ? (
             <Skeleton className="h-10 w-24" />
           ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("relative h-10 w-10 rounded-full", navItemClasses)}>
                   <Avatar className="h-10 w-10">
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard"><LayoutDashboard className='mr-2'/>Hypeman</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/dashboard/user"><User className='mr-2'/>Spotlight</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           ) : (
            <>
              <Button variant="ghost" asChild className={cn(navItemClasses, 'hidden sm:flex')}>
                  <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className='glowing-btn'>
                  <Link href="/signup">Sign Up</Link>
              </Button>
            </>
           )}


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
