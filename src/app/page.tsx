import Image from 'next/image';
import Link from 'next/link';
import { Club, Mic, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEvents } from '@/lib/data';
import { Header } from '@/components/layout/Header';

export default function Home() {
  const events = getEvents();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <PartyPopper className="w-16 h-16 text-accent neon-glow" />
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline glowing-text">
                Welcome to HypeConnect
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Join the party, find your event, and send some hype to your favorite MCs.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-card/50">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter text-center mb-10 font-headline">
              Live Events
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 group bg-card"
                >
                  <CardHeader className="p-0 relative">
                    <Image
                      src={event.imageUrl}
                      alt={event.clubName}
                      width={600}
                      height={400}
                      className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint="nightclub party"
                    />
                     <Badge variant="destructive" className="absolute top-2 right-2 glowing-text">LIVE</Badge>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="flex items-center gap-2 font-headline">{event.clubName}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <Mic className="w-4 h-4" />
                      <span>{event.hypeman.name}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4">
                    <Button asChild className="w-full glowing-btn">
                      <Link href={`/event/${event.id}`}>Join & Send Hype</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
