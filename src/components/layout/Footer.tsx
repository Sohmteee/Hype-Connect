import Link from 'next/link';
import { HypeSonoveaLogo } from '@/components/icons';
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
              <HypeSonoveaLogo className="h-8 w-8 text-primary neon-glow-primary" />
              <span className="font-bold text-xl font-headline">HypeSonovea</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting the crowd to the stage, one hype at a time.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:hype.sonovea@gmail.com" className="hover:text-primary">hype.sonovea@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {/* Display in Nigerian local format for readability, use E.164 for tel: href */}
                <a href="tel:+2347089045502" aria-label="Call 0708 904 5502" className="hover:text-primary">0708 904 5502</a>
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
          © {new Date().getFullYear()} HypeSonovea. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
