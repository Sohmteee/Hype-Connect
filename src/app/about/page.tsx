'use client';

import { Header } from '@/components/layout/Header';
import { HypeConnectLogo } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="container py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <HypeConnectLogo className="h-20 w-20 mx-auto mb-4 text-primary neon-glow-primary" />
            <h1 className="text-4xl font-bold tracking-tighter font-headline sm:text-5xl">
              About HypeConnect
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Connecting the crowd to the stage, one hype at a time.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                HypeConnect was born from the energy of live events. We saw a gap between the audience wanting to interact and the artists on stage ready to engage. Our mission is to bridge that gap with a seamless, exciting, and real-time platform.
              </p>
              <p>
                We empower fans to send shoutouts, song requests, and tips directly to the hypemen and DJs who make the party unforgettable. At the same time, we provide performers with a powerful tool to connect with their audience, boost engagement, and earn more from their craft.
              </p>
              <p>
                Whether you're in the crowd or on the stage, HypeConnect is here to amplify the experience and make every event more interactive, personal, and memorable.
              </p>
            </CardContent>
          </Card>
           <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
