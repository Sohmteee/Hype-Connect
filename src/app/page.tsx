
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Club,
  Hourglass,
  MapPin,
  Mic,
  PartyPopper,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Video,
  Volume2,
  Wallet,
} from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Hypeman } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { HandMicIcon, PaperCashIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { CardDescription } from '@/components/ui/card';
import { AnimateOnScroll } from '@/components/AnimateOnScroll';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

function HowItWorks() {
  const steps = [
    {
      icon: <Search className="w-10 h-10 mb-4 text-accent" />,
      title: 'Find Your Event',
      description:
        'Browse live events and find where you and your friends are.',
    },
    {
      icon: <Send className="w-10 h-10 mb-4 text-accent" />,
      title: 'Send Your Hype',
      description:
        'Craft your message, choose a tip amount, and send it directly to the MC.',
    },
    {
      icon: <Volume2 className="w-10 h-10 mb-4 text-accent" />,
      title: 'Get a Shoutout',
      description:
        'Listen for your name! The MC will give you a live shoutout during the event.',
    },
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-center mb-12 font-headline">
            How HypeConnect Works
          </h2>
        </AnimateOnScroll>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <AnimateOnScroll key={index} delay={index * 0.1}>
              <Card
                className="bg-card/50 text-center flex flex-col items-center p-6 h-full"
              >
                <AnimateOnScroll
                    animation="flip"
                    delay={index * 0.2}
                    className="p-4 bg-primary/10 rounded-full mb-4 neon-glow-primary"
                >
                  {step.icon}
                </AnimateOnScroll>
                <CardHeader className="p-0">
                  <CardTitle className="font-headline">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2">
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyHypeConnect() {
  const features = [
    {
      icon: <ShieldCheck className="w-10 h-10 mb-4 text-accent" />,
      title: '100% Secure Payments',
      description:
        'Your transactions are protected with industry-leading payment gateways. Tip with confidence.',
    },
    {
      icon: <PartyPopper className="w-10 h-10 mb-4 text-accent" />,
      title: '100% Fun Guaranteed',
      description:
        'We connect you directly to the action. Your hype gets heard, making you a real part of the event.',
    },
    {
      icon: <Wallet className="w-10 h-10 mb-4 text-accent" />,
      title: 'Empowering Creators',
      description:
        'We support hypemen and DJs by providing a new way to engage with their audience and earn from their craft.',
    },
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-card/50">
      <div className="container px-4 md:px-6">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-center mb-12 font-headline">
            The HypeConnect Guarantee
          </h2>
        </AnimateOnScroll>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <AnimateOnScroll key={index} delay={index * 0.1}>
              <Card className="bg-card text-center flex flex-col items-center p-6 h-full border-primary/20">
                 <AnimateOnScroll
                    animation="flip"
                    delay={index * 0.2}
                    className="p-4 bg-primary/10 rounded-full mb-4 neon-glow-primary"
                >
                  {feature.icon}
                </AnimateOnScroll>
                <CardHeader className="p-0">
                  <CardTitle className="font-headline">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}


function FeaturedHypemen({ hypemen }: { hypemen: Hypeman[] }) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-center mb-12 font-headline">
            Featured Hypemen
          </h2>
        </AnimateOnScroll>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          {hypemen.map((hypeman, index) => (
            <AnimateOnScroll key={hypeman.id} delay={index * 0.1}>
              <Card
                className="text-center p-4 border-2 border-transparent hover:border-accent transition-all duration-300 bg-card flex flex-col items-center justify-start h-full"
              >
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-accent">
                  <AvatarImage
                    src={hypeman.avatarUrl}
                    alt={hypeman.name}
                    data-ai-hint="person portrait"
                    className="object-cover"
                  />
                  <AvatarFallback>{hypeman.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardHeader className="p-0">
                  <CardTitle className="text-xl font-headline">
                    {hypeman.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

const hypeHeadlines = [
  'Welcome to HypeConnect',
  'The Life of the Party',
  'Your Voice, Your Vibe',
  'E Choke! Send Your Hype',
  'Oya, Make Somebody Known!',
  'The Ultimate Shoutout Platform',
];

export default function Home() {
  const allEvents = getEvents();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [locationTerm, setLocationTerm] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'live'>('live');
  const [headline, setHeadline] = React.useState(hypeHeadlines[0]);
  const heroImages = PlaceHolderImages.filter(img => img.id.startsWith('hero-banner'));

  React.useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      index = (index + 1) % hypeHeadlines.length;
      setHeadline(hypeHeadlines[index]);
    }, 3000); // Change text every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  const featuredHypemen = Array.from(
    new Map(allEvents.map((event) => [event.hypeman.id, event.hypeman])).values()
  );

  const filteredEvents = allEvents.filter(
    (event) =>
      (event.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.hypeman.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (event.location.toLowerCase().includes(locationTerm.toLowerCase())) &&
      (filter === 'live' ? event.isActive : true)
  );

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative w-full h-[90vh] text-white overflow-hidden">
          <Carousel
            className="w-full h-full"
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: false,
              }),
            ]}
            opts={{
              loop: true,
            }}
          >
            <CarouselContent className="h-full -ml-0">
              {heroImages.map((image, index) => (
                <CarouselItem key={index} className="pl-0">
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-cover"
                    data-ai-hint={image.imageHint}
                    priority={index === 0}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="relative z-10 container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-6">
                <PartyPopper className="w-16 h-16 text-accent neon-glow" />
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline glowing-text transition-all duration-500">
                    {headline}
                </h1>
                <p className="max-w-[700px] text-neutral-200 md:text-xl">
                    Join the party, find your event, and send some hype to your
                    favorite MCs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Button asChild size="lg" className="glowing-accent-btn px-10 py-6 text-lg">
                    <Link href="#events">Find Event</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent px-10 py-6 text-lg">
                    <Link href="/book-video-hype"><Video className="mr-2"/>Book a Video</Link>
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="events"
          className="w-full py-12 md:py-24 lg:py-32 bg-card/50"
        >
          <div className="container px-4 md:px-6">
            <AnimateOnScroll>
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <HandMicIcon className="w-12 h-12 text-accent neon-glow" />
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tighter font-headline">
                    Live Events
                  </h2>
                  <PaperCashIcon className="w-12 h-12 text-accent neon-glow" />
                </div>
                <p className="text-muted-foreground mt-2">
                  Find where the party is at tonight.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="max-w-2xl mx-auto mb-10">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow">
                    <Input
                      type="search"
                      placeholder="Search for an event or hypeman..."
                      className="w-full text-base h-12 pl-12 pr-4"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search by location..."
                      className="w-full text-base h-12 pl-12 pr-4 sm:w-auto"
                      value={locationTerm}
                      onChange={(e) => setLocationTerm(e.target.value)}
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="flex justify-center gap-2 mb-8">
                <Button
                  variant={filter === 'live' ? 'default' : 'outline'}
                  onClick={() => setFilter('live')}
                  className={cn(filter === 'live' && 'glowing-btn')}
                >
                  Live Now
                </Button>
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={cn(filter === 'all' && 'glowing-btn')}
                >
                  All Events
                </Button>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-center">
              {filteredEvents.map((event, index) => (
                <AnimateOnScroll key={event.id} delay={index * 0.05}>
                  <Card
                    className="overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 group bg-card h-full"
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
                      {event.isActive && (
                        <Badge
                          variant="destructive"
                          className="absolute top-2 right-2 glowing-text"
                        >
                          LIVE
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="flex items-center gap-2 font-headline">
                        <Club className="w-5 h-5 text-accent" />
                        {event.clubName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Mic className="w-4 h-4" />
                        <span>{event.hypeman.name}</span>
                      </CardDescription>
                       <CardDescription className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="p-4">
                      <Button asChild className="w-full glowing-btn">
                        <Link href={`/event/${event.id}`}>
                          Join & Send Hype
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </AnimateOnScroll>
              ))}
               {filteredEvents.length > 0 && filteredEvents.length < 4 && (
                  <AnimateOnScroll>
                    <Card className="overflow-hidden bg-card/80 border-2 border-dashed border-muted flex flex-col items-center justify-center text-center p-4 h-full">
                        <Hourglass className="w-12 h-12 text-accent animate-bounce" />
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">More Events Soon</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Check back later for more parties!</p>
                        </CardContent>
                    </Card>
                  </AnimateOnScroll>
              )}
            </div>
            {filteredEvents.length === 0 && (
              <AnimateOnScroll>
                <p className="text-center text-muted-foreground mt-8">
                  No events found matching your criteria.
                </p>
              </AnimateOnScroll>
            )}
          </div>
        </section>

        <HowItWorks />
        
        <WhyHypeConnect />

        <FeaturedHypemen hypemen={featuredHypemen} />
      </main>
    </>
  );
}
