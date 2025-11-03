'use client';
import { notFound } from 'next/navigation';
import * as React from 'react';
import Image from 'next/image';
import { Club, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEventById } from '@/lib/data';
import type { ClubEvent } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { HypeConnectLogo } from '@/components/icons';

export default function QrCodePage({ params }: { params: { id: string } }) {
  const [event, setEvent] = React.useState<ClubEvent | null>(null);
  const [eventUrl, setEventUrl] = React.useState('');

  React.useEffect(() => {
    const foundEvent = getEventById(params.id);
    if (foundEvent) {
      setEvent(foundEvent);
      if (typeof window !== 'undefined') {
        setEventUrl(`${window.location.origin}/event/${params.id}`);
      }
    } else {
      notFound();
    }
  }, [params.id]);

  if (!event || !eventUrl) {
    return null; // Or a loading skeleton
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    eventUrl
  )}&qzone=1&color=FFD700&bgcolor=22152F`;

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-2xl shadow-primary/20">
          <CardHeader>
            <div className="mx-auto mb-4">
                <HypeConnectLogo className="h-12 w-12 text-primary neon-glow-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Scan to Send Hype</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-background rounded-lg p-4 flex items-center justify-center">
              <Image
                src={qrCodeUrl}
                alt={`QR Code for ${event.clubName}`}
                width={300}
                height={300}
                unoptimized
                className='rounded-md'
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold flex items-center justify-center gap-2">
                <Club className="h-6 w-6 text-accent" />
                {event.clubName}
              </h3>
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <Mic className="h-5 w-5" />
                {event.hypeman.name}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
