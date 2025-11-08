
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Calendar,
  Gift,
  Loader2,
  Mail,
  MessageSquare,
  Mic,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getEvents } from '@/lib/data';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';

const bookingFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  hypemanId: z.string({ required_error: 'Please select a hypeman.' }),
  occasion: z.string({ required_error: 'Please select an occasion.' }),
  videoDetails: z
    .string()
    .min(10, { message: 'Details must be at least 10 characters long.' })
    .max(500, { message: 'Details cannot exceed 500 characters.' }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const occasions = ['Birthday', 'Wedding', 'Anniversary', 'Graduation', 'Shoutout', 'Other'];
const bookingPrice = 25000;

export default function BookVideoHypePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [user] = useAuthState(auth);
  const [hypemen, setHypemen] = React.useState<Array<any>>([]);
  const [search, setSearch] = React.useState('');

  const allEvents = getEvents();
  // fallback: derived hypemen from local events
  const fallbackHypemen = Array.from(
    new Map(allEvents.map((event) => [event.hypeman.id, event.hypeman])).values()
  );

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: user?.displayName || '',
      email: user?.email || '',
    },
  });

  // Fetch public hypemen from backend
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/hypemen');
        const json = await res.json();
        if (mounted && json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setHypemen(json.data || []);
        } else if (mounted) {
          // If API returns empty list, fall back to locally derived hypemen
          setHypemen(fallbackHypemen);
          console.warn('Hypemen API returned empty; using fallbackHypemen');
        }
      } catch (err) {
        console.error('Failed to fetch hypemen:', err);
        setHypemen(fallbackHypemen);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Decide which list to display (API or fallback)
  const listToDisplay = (hypemen && hypemen.length > 0) ? hypemen : fallbackHypemen;
  const hypemenCount = listToDisplay.length;

  function onSubmit(data: BookingFormValues) {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please log in to book a video.', variant: 'destructive' });
      router.push(`/auth/login?redirect=${encodeURIComponent('/book-video-hype')}`);
      return;
    }

    setIsSubmitting(true);

    (async () => {
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) {
          toast({ title: 'Booking Failed', description: json.error || 'Failed to create booking', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }

        // Redirect to payment
        const paymentUrl = json.data?.paymentUrl;
        if (paymentUrl) {
          // Save pending booking info in sessionStorage so callback can resume
          sessionStorage.setItem('pendingBooking', JSON.stringify({ name: data.name, email: data.email, hypemanId: data.hypemanId }));
          window.location.href = paymentUrl;
          return;
        }

        toast({ title: 'Success', description: 'Your booking was created.', });
        router.push('/dashboard/user');
      } catch (error) {
        console.error('Booking error:', error);
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      } finally {
        setIsSubmitting(false);
      }
    })();
  }

  return (
    <>
      <Header />
      <main className="container flex-1 flex items-center justify-center py-12 md:py-24">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">
              Book a Personalized Video Hype
            </CardTitle>
            <CardDescription>
              Get a custom video shoutout from your favorite hypeman for any
              occasion!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><User /> Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Mail /> Your Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-foreground mb-2 block">Search Hypeman</label>
                    <Input placeholder="Search hypeman by name" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>

                  <div className="mb-6">
                    <Card className="p-4 mb-4">
                      <CardHeader>
                        <CardTitle className="text-lg">Available Hypemen</CardTitle>
                        <CardDescription className="text-sm">Choose from our verified hypemen.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">Showing {hypemenCount} {hypemenCount === 1 ? 'hypeman' : 'hypemen'}</div>
                          <div className="text-xs text-muted-foreground">Scroll to browse</div>
                        </div>
                        {/* Fixed-height scrollable list to keep layout stable */}
                        <div className="max-h-56 overflow-y-auto pr-2">
                          <ul className="space-y-2">
                            {listToDisplay
                              .filter(h => h.displayName.toLowerCase().includes(search.toLowerCase()))
                              .map(h => (
                                <li key={h.profileId} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback className="bg-muted text-muted-foreground">
                                        {h.displayName ? h.displayName.charAt(0).toUpperCase() : 'H'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-semibold">{h.displayName}</div>
                                      <div className="text-sm text-muted-foreground">{h.publicBio}</div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <FormField
                    control={form.control}
                    name="hypemanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Mic /> Choose a Hypeman</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a hypeman" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(hypemen.length > 0 ? hypemen : fallbackHypemen).map((hypeman: any) => (
                              <SelectItem key={hypeman.profileId || hypeman.id} value={hypeman.profileId || hypeman.id}>
                                {hypeman.displayName || hypeman.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occasion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Gift /> Occasion</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="What's the occasion?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {occasions.map((occasion) => (
                              <SelectItem key={occasion} value={occasion}>
                                {occasion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="videoDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><MessageSquare /> Video Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell the hypeman what to say. Include names, inside jokes, and any special requests!"
                          {...field}
                          rows={5}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 500 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-center p-4 rounded-lg bg-secondary">
                  <p className="font-bold text-2xl text-primary">Total: ₦{bookingPrice.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">You will be prompted for payment after submission.</p>
                  <div className="mt-3 flex items-center justify-center text-xs text-muted-foreground gap-2">
                    <span className="inline-block rounded px-2 py-1 bg-muted/10 text-muted-foreground">Payment powered by <strong className="ml-1">Lexora</strong></span>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full glowing-accent-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Submitting Booking...
                    </>
                  ) : (
                    'Book Video Hype'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
