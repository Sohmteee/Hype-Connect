'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { submitHypeConfirmedAction } from '@/app/dashboard/actions';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Processing payment confirmation...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const reference = searchParams.get('reference');

        if (!reference) {
          setStatus('failed');
          setMessage('No payment reference provided');
          setTimeout(() => {
            router.push('/');
          }, 3000);
          return;
        }

        // Verify payment using our API route (server-side)
        const response = await fetch(`/api/payment/verify?reference=${reference}`);
        const verification = await response.json();

        if (verification.status && verification.data?.status === 'success') {
          setStatus('success');
          setMessage('Payment successful! Creating your hype...');

          // Get the hype data from session storage
          const pendingHypeStr = sessionStorage.getItem('pendingHype');

          if (pendingHypeStr) {
            try {
              const pendingHype = JSON.parse(pendingHypeStr);

              // Create the hype message with the payment reference
              const hypeResult = await submitHypeConfirmedAction(
                pendingHype.userId,
                pendingHype.eventId,
                {
                  message: pendingHype.message,
                  amount: pendingHype.amount,
                  senderName: pendingHype.senderName,
                  paystackReference: reference,
                  profileId: pendingHype.profileId,
                }
              );

              if (!hypeResult.success) {
                console.error('Failed to create hype:', hypeResult.error);
              }

              // Clear session storage
              sessionStorage.removeItem('pendingHype');
            } catch (error) {
              console.error('Error parsing pending hype:', error);
            }
          }

          // Get the event ID from metadata
          const eventId = verification.data?.metadata?.eventId;

          // Redirect to event page after 2 seconds
          setTimeout(() => {
            if (eventId) {
              router.push(`/event/${eventId}?payment=success`);
            } else {
              router.push('/');
            }
          }, 2000);
        } else {
          setStatus('failed');
          setMessage(verification.data?.status === 'failed'
            ? 'Payment was declined'
            : 'Payment verification failed or was cancelled');

          // Redirect back to home after 3 seconds
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('failed');
        setMessage(error instanceof Error ? error.message : 'An error occurred');

        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-primary shadow-lg shadow-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-accent">HypeSonovea</CardTitle>
          <CardDescription className="text-muted-foreground">Payment Processing</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <div className="text-5xl">✅</div>
            )}
            {status === 'failed' && (
              <div className="text-5xl">❌</div>
            )}
          </div>

          <div className="text-center">
            <p className={`text-lg font-medium ${status === 'success' ? 'text-green-400' :
              status === 'failed' ? 'text-red-400' :
                'text-foreground'
              }`}>
              {message}
            </p>
          </div>

          {status === 'loading' && (
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we confirm your payment...
            </p>
          )}

          {status === 'success' && (
            <p className="text-sm text-muted-foreground text-center">
              Your hype message has been sent! Redirecting you back to the event...
            </p>
          )}

          {status === 'failed' && (
            <p className="text-sm text-muted-foreground text-center">
              Redirecting you back to the home page...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
