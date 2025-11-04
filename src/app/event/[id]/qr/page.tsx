
'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import * as React from 'react';
import Image from 'next/image';
import { Club, Mic, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getEventById } from '@/lib/data';
import type { ClubEvent } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { HypeConnectLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';

function QrCodeDetails({ event }: { event: ClubEvent }) {
  const router = useRouter();
  const [eventUrl, setEventUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setEventUrl(`${window.location.origin}/event/${event.id}`);
    }
  }, [event.id]);

  if (!eventUrl) {
    return null; // Or a loading skeleton
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    eventUrl
  )}&qzone=1&color=9400D3&bgcolor=000000`;

  return (
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
        <CardFooter className='justify-center'>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
            </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function QrCodePage() {
    const params = useParams();
    const [event, setEvent] = React.useState<ClubEvent | null>(null);
    const [loading, setLoading] = React.useState(true);

    const id = typeof params.id === 'string' ? params.id : '';

    React.useEffect(() => {
        if (!id) return;
        const eventData = getEventById(id);
        if (!eventData) {
            notFound();
        } else {
            setEvent(eventData);
            setLoading(false);
        }
    }, [id]);


    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!event) {
        return null;
    }
    
    return (
        <>
            <Header />
            <QrCodeDetails event={event} />
        </>
    )
}
