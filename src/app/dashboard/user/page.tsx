
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Video, Calendar, Download, Mic, ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Mock data, in a real app, this would come from Firestore
const mockBookings = [
    {
        id: 'booking-1',
        hypemanName: 'MC Gusto',
        occasion: 'Birthday',
        bookingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'completed',
        videoUrl: '#', // Placeholder
        imageUrl: 'https://images.unsplash.com/photo-1521116311953-abc4a2fa7d7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxtYW4lMjBtaWNyb3Bob25lfGVufDB8fHx8MTc2MjIwMTQ0OHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        id: 'booking-2',
        hypemanName: 'DJ Flex',
        occasion: 'Shoutout',
        bookingDate: new Date(),
        status: 'pending',
        videoUrl: null,
        imageUrl: 'https://images.unsplash.com/photo-1631786083436-02d4b1c98207?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwZGp8ZW58MHx8fHwxNzYyMjAxNDQ4fDA&ixlib-rb-4.1.0&q=80&w=1080',
    }
];

export default function UserDashboardPage() {
  
  return (
    <>
      <Header />
      <main className="container py-8 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter font-headline text-center sm:text-left">
            Your Video Bookings
          </h1>
          <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2"/>
                Go Home
              </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
                <Image src={booking.imageUrl} alt={booking.hypemanName} width={400} height={200} className="w-full h-48 object-cover" data-ai-hint="nightclub party" />
              <CardHeader>
                <div className='flex justify-between items-start'>
                    <CardTitle>Video for {booking.occasion}</CardTitle>
                    <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                </div>
                <CardDescription className="flex items-center gap-2 pt-1"><Mic /> From {booking.hypemanName}</CardDescription>
                <CardDescription className="flex items-center gap-2 pt-1"><Calendar /> Booked on {format(booking.bookingDate, 'PPP')}</CardDescription>
              </CardHeader>
              <CardContent>
                {booking.status === 'pending' && <p className='text-sm text-muted-foreground'>Your video is being created. You'll be notified when it's ready!</p>}
                 {booking.status === 'completed' && <p className='text-sm text-muted-foreground'>Your video is ready to be downloaded!</p>}
              </CardContent>
              <CardFooter>
                <Button className="w-full glowing-accent-btn" disabled={booking.status !== 'completed'}>
                  <Download className="mr-2" />
                  Download Video
                </Button>
              </CardFooter>
            </Card>
          ))}
            <Card className="border-dashed border-2 flex flex-col items-center justify-center text-center p-8">
                <CardTitle>Want another video?</CardTitle>
                <CardDescription className="my-4">Book a personalized video for any occasion.</CardDescription>
                <Button asChild>
                    <Link href="/book-video-hype">
                        <Video className="mr-2" />
                        Book a New Video
                    </Link>
                </Button>
            </Card>
        </div>
      </main>
    </>
  );
}
