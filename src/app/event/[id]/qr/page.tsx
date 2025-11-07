'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import * as React from 'react';
import Image from 'next/image';
import { Loader2, Mic, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { HypeSonoveaLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { getEventAction } from '@/app/dashboard/actions';

interface Event {
  id: string;
  name: string;
  location: string;
  hypemanProfileId: string;
  isActive: boolean;
  createdAt: string;
}

function QrCodeDisplay({ event }: { event: Event }) {
  const router = useRouter();
  const [eventUrl, setEventUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setEventUrl(`${window.location.origin}/event/${event.id}`);
    }
  }, [event.id]);

  if (!eventUrl) {
    return null;
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    eventUrl
  )}&qzone=1&color=9400D3&bgcolor=000000`;

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center shadow-2xl shadow-primary/20">
        <CardHeader>
          <div className="mx-auto mb-4">
            <HypeSonoveaLogo className="h-12 w-12 text-primary neon-glow-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Scan to Send Hype</CardTitle>
          <CardDescription>Get hyped at {event.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-background rounded-lg p-4 flex items-center justify-center">
            <Image
              src={qrCodeUrl}
              alt={`QR Code for ${event.name}`}
              width={300}
              height={300}
              unoptimized
              className='rounded-md'
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">
              {event.name}
            </h3>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Mic className="h-5 w-5" />
              {event.location}
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
  const [event, setEvent] = React.useState<Event | null>(null);
  const [loading, setLoading] = React.useState(true);

  const id = typeof params.id === 'string' ? params.id : '';

  React.useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const response = await getEventAction(id);
        if (response.success && response.data) {
          setEvent({
            id,
            name: response.data.name || '',
            location: response.data.location || '',
            hypemanProfileId: response.data.hypemanProfileId || '',
            isActive: response.data.isActive ?? false,
            createdAt: response.data.createdAt || new Date().toISOString(),
          });
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Fetch event error:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);


  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <>
      <Header />
      <QrCodeDisplay event={event} />
    </>
  )
}
