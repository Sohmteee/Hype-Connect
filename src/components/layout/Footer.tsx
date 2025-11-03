import Link from 'next/link';
import { HypeConnectLogo } from '@/components/icons';
import { Twitter, Instagram, Facebook, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <HypeConnectLogo className="h-8 w-8 text-primary neon-glow-primary" />
              <span className="font-bold text-xl font-headline">HypeConnect</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting the crowd to the stage, one hype at a time.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-1">
              <li><Link href="/#events" className="text-muted-foreground hover:text-primary">Live Events</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
              <li><Link href="/signup" className="text-muted-foreground hover:text-primary">For Hypemen</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@hypeconnect.com" className="hover:text-primary">info@hypeconnect.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+234 812 345 6789</span>
              </li>
            </ul>
          </div>
           <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Follow Us</h4>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <a href="#" aria-label="Twitter"><Twitter /></a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="#" aria-label="Instagram"><Instagram /></a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="#" aria-label="Facebook"><Facebook /></a>
              </Button>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} HypeConnect. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
