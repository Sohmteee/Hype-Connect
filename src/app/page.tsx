
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Club,
  MapPin,
  Mic,
  PartyPopper,
  Search,
  Send,
  Volume2,
} from 'lucide-react';
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
        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12 font-headline">
          How HypeConnect Works
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="bg-card/50 text-center flex flex-col items-center p-6"
            >
              <div className="p-4 bg-primary/10 rounded-full mb-4 neon-glow-primary">
                {step.icon}
              </div>
              <CardHeader className="p-0">
                <CardTitle className="font-headline">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-2">
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
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
        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12 font-headline">
          Featured Hypemen
        </h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          {hypemen.map((hypeman) => (
            <Card
              key={hypeman.id}
              className="text-center p-4 border-2 border-transparent hover:border-accent transition-all duration-300 bg-card"
            >
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-accent">
                <AvatarImage
                  src={hypeman.avatarUrl}
                  alt={hypeman.name}
                  data-ai-hint="person portrait"
                />
                <AvatarFallback>{hypeman.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-headline">
                  {hypeman.name}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const allEvents = getEvents();
  const [searchTerm, setSearchTerm] = React.useState('');

  const featuredHypemen = Array.from(
    new Map(allEvents.map((event) => [event.hypeman.id, event.hypeman])).values()
  );

  const filteredEvents = allEvents.filter(
    (event) =>
      event.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.hypeman.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1">
      <div className="relative">
        <Header />
        <main className="flex-1">
          <section className="relative w-full h-screen flex items-center justify-center text-center text-white overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1521116311953-abc4a2fa7d7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxtYW4lMjBtaWNyb3Bob25lfGVufDB8fHx8MTc2MjIwMTQ0OHww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Hypeman with a microphone"
              fill
              className="object-cover"
              data-ai-hint="man microphone"
              priority
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4">
                <PartyPopper className="w-16 h-16 text-accent neon-glow" />
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline glowing-text">
                  Welcome to HypeConnect
                </h1>
                <p className="max-w-[700px] text-neutral-200 md:text-xl">
                  Join the party, find your event, and send some hype to your
                  favorite MCs.
                </p>
              </div>
            </div>
          </section>

          <section
            id="events"
            className="w-full py-12 md:py-24 lg:py-32 bg-card/50"
          >
            <div className="container px-4 md:px-6">
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
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredEvents.map((event) => (
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
                      <Badge
                        variant="destructive"
                        className="absolute top-2 right-2 glowing-text"
                      >
                        LIVE
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="flex items-center gap-2 font-headline">
                        <Club className="w-5 h-5 text-accent" />
                        {event.clubName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Mic className="w-4 h-4" />
                        <span>{event.hypeman.name}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4">
                      <Button asChild className="w-full glowing-btn">
                        <Link href={`/event/${event.id}`}>
                          Join & Send Hype
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {filteredEvents.length === 0 && (
                <p className="text-center text-muted-foreground mt-8">
                  No events found matching your search.
                </p>
              )}
            </div>
          </section>

          <HowItWorks />

          <FeaturedHypemen hypemen={featuredHypemen} />
        </main>
      </div>
    </div>
  );
}
