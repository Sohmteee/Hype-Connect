'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Crown,
  DollarSign,
  MessageSquare,
  Mic,
  QrCode,
  User,
  ArrowLeft,
  MapPin,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, notFound, useParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { submitHypeAction, getLeaderboardAction, getEventAction } from '@/app/dashboard/actions';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase';

const hypeFormSchema = z.object({
  message: z
    .string()
    .min(5, { message: 'Message must be at least 5 characters.' })
    .max(140, { message: 'Message must not be longer than 140 characters.' }),
  amount: z.coerce.number().min(50000, { message: 'Minimum amount is ₦50,000.' }),
});

type HypeFormValues = z.infer<typeof hypeFormSchema>;

const amounts = [50000, 100000, 500000, 1000000];

interface LeaderboardItem {
  senderName: string;
  amount: number;
  message: string;
  timestamp: string;
  userId?: string;
  avatarUrl?: string | null;
}

function Leaderboard({ items, isLoading }: { items: LeaderboardItem[], isLoading: boolean }) {
  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <Crown className="neon-glow" />
          Top Tippers
        </CardTitle>
        <CardDescription>
          Biggest supporters of this event.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length > 0 ? (
          <ul className="space-y-4">
            {items.map((item, index) => (
              <li key={`${item.senderName}-${index}`} className="flex items-center gap-4">
                <span className="font-bold text-lg text-muted-foreground">{index + 1}</span>
                <Avatar>
                  {item.avatarUrl ? (
                    <AvatarImage src={item.avatarUrl} alt={item.senderName} />
                  ) : (
                    <AvatarFallback>{item.senderName.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.senderName}</p>
                  <p className="text-sm text-muted-foreground">
                    ₦{item.amount.toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hypes yet. Be the first!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Event {
  id: string;
  name: string;
  location: string;
  hypemanProfileId: string;
  isActive: boolean;
  createdAt: string;
}

function EventDetails({ event, leaderboard, isLeaderboardLoading }: { event: Event, leaderboard: LeaderboardItem[], isLeaderboardLoading: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [user] = useAuthState(auth);

  const form = useForm<HypeFormValues>({
    resolver: zodResolver(hypeFormSchema),
    defaultValues: {
      message: '',
      amount: 0,
    },
  });

  const selectedAmount = form.watch('amount');
  const [customAmountActive, setCustomAmountActive] = React.useState(false);

  async function onSubmit(data: HypeFormValues) {
    if (!event || !user) {
      toast({
        title: 'Sign in required',
        description: 'Please log in to send hype to this event.',
        variant: 'destructive',
      });
      // Redirect to login with the current event page as the redirect destination
      const currentEventPath = `/event/${event?.id || ''}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentEventPath)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the server action to initialize payment
      const result = await submitHypeAction(user.uid, event.id, {
        message: data.message,
        amount: data.amount,
        senderName: user.displayName || 'Anonymous',
        email: user.email || '',
      });

      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send hype',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Store hype data in session storage - it will be created via webhook on payment success
      const hypeData = {
        eventId: event.id,
        userId: user.uid,
        profileId: user.uid,
        message: data.message,
        amount: data.amount,
        senderName: user.displayName || 'Anonymous',
        reference: result.data?.reference,
      };
      sessionStorage.setItem('pendingHype', JSON.stringify(hypeData));

      // Show info message
      toast({
        title: 'Redirecting to payment...',
        description: 'Your hype will be sent after payment is confirmed.',
      });

      // Redirect to Paystack payment page
      if (result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to get payment URL',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Submit hype error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  }

  // Check if returning from payment
  React.useEffect(() => {
    const handlePaymentReturn = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentSuccess = searchParams.get('payment');

      if (paymentSuccess === 'success') {
        sessionStorage.removeItem('pendingHype');
        toast({
          title: '✅ Success!',
          description: 'Your hype message has been sent! It will appear shortly.',
        });
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      const pendingHypeStr = sessionStorage.getItem('pendingHype');
      if (!pendingHypeStr) return;

      try {
        const hypeData = JSON.parse(pendingHypeStr);
        toast({
          title: 'Payment processing...',
          description: 'Your hype message will appear once payment is confirmed. This may take a few moments.',
        });

        setTimeout(() => {
          sessionStorage.removeItem('pendingHype');
        }, 3000);
      } catch (error) {
        console.error('Error parsing pending hype:', error);
        sessionStorage.removeItem('pendingHype');
      }
    };

    handlePaymentReturn();
  }, [toast]);

  return (
    <main className="container py-8 md:py-12">
      <div className="grid gap-12 md:grid-cols-5 lg:grid-cols-3">
        <div className="md:col-span-3 lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl font-headline">{event.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Hypeman Event
              </CardDescription>
              <CardDescription className="flex items-center gap-2 pt-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/event/${event.id}/qr`}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Show Event QR Code
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Your Hype</CardTitle>
              <CardDescription>
                Your message will be sent to the hypeman in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user && (
                <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-md">
                  <p className="text-sm text-accent mb-3">You must be logged in to send hype.</p>
                  <Button asChild className="w-full">
                    {/* Preserve the current page so user returns after login */}
                    <Link href={`/auth/login?redirect=${encodeURIComponent(pathname || `/event/${event.id}`)}`}>
                      Log In to Continue
                    </Link>
                  </Button>
                </div>
              )}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><MessageSquare /> Hype Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Shout out my guys on table 5!"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2"><DollarSign /> Amount (₦)</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              if (value === 'other') {
                                setCustomAmountActive(true);
                              } else {
                                setCustomAmountActive(false);
                                field.onChange(Number(value));
                              }
                            }}
                            className="grid grid-cols-2 gap-4 sm:grid-cols-5"
                          >
                            {amounts.map((amount) => (
                              <FormItem key={amount} className="relative">
                                <FormControl>
                                  <RadioGroupItem value={String(amount)} id={`amount-${amount}`} className="sr-only peer" />
                                </FormControl>
                                <FormLabel
                                  htmlFor={`amount-${amount}`}
                                  className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                    selectedAmount === amount && !customAmountActive && "border-primary bg-primary text-primary-foreground"
                                  )}
                                >
                                  {amount.toLocaleString()}
                                </FormLabel>
                              </FormItem>
                            ))}
                            <FormItem className="relative">
                              <FormControl>
                                <RadioGroupItem value="other" id="amount-other" className="sr-only peer" />
                              </FormControl>
                              <FormLabel
                                htmlFor="amount-other"
                                className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                  customAmountActive && "border-primary bg-primary text-primary-foreground"
                                )}
                              >
                                Other
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        {customAmountActive && (
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter amount in numbers"
                              className="mt-2"
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              min="50000"
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full glowing-accent-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" />
                        Sending Hype...
                      </>
                    ) : !user ? (
                      'Log in to Send Hype'
                    ) : (
                      'Send Hype'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <Leaderboard items={leaderboard} isLoading={isLeaderboardLoading} />
        </div>
      </div>
    </main>
  );
}

export default function EventPage() {
  const params = useParams();
  const [event, setEvent] = React.useState<Event | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = React.useState(false);
  const { toast } = useToast();

  const id = typeof params.id === 'string' ? params.id : '';

  React.useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      try {
        // Fetch event details
        const eventResponse = await getEventAction(id);
        if (eventResponse.success && eventResponse.data) {
          setEvent({
            id,
            name: eventResponse.data.name || '',
            location: eventResponse.data.location || '',
            hypemanProfileId: eventResponse.data.hypemanProfileId || '',
            isActive: eventResponse.data.isActive ?? false,
            createdAt: eventResponse.data.createdAt || new Date().toISOString(),
          });

          // Fetch leaderboard
          setLeaderboardLoading(true);
          const leaderboardResponse = await getLeaderboardAction(id, 20);
          if (leaderboardResponse.success && leaderboardResponse.data) {
            setLeaderboard(leaderboardResponse.data);
          }
        } else {
          toast({
            title: 'Error',
            description: 'Event not found',
            variant: 'destructive',
          });
          notFound();
        }
      } catch (error) {
        console.error('Fetch error:', error);
        notFound();
      } finally {
        setLoading(false);
        setLeaderboardLoading(false);
      }
    };

    fetchEventData();
  }, [id, toast]);

  // Refresh leaderboard every 5 seconds
  React.useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const response = await getLeaderboardAction(id, 20);
        if (response.success && response.data) {
          setLeaderboard(response.data);
        }
      } catch (error) {
        console.error('Refresh leaderboard error:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="container py-12 flex items-center justify-center">
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
      <EventDetails event={event} leaderboard={leaderboard} isLeaderboardLoading={leaderboardLoading} />
    </>
  );
}
