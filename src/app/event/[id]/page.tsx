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
  Wallet,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, notFound } from 'next/navigation';
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
import { addHype, getEventById, getLeaderboardForEvent } from '@/lib/data';
import type { ClubEvent, Tipper } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const hypeFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  message: z
    .string()
    .min(5, { message: 'Message must be at least 5 characters.' })
    .max(140, { message: 'Message must not be longer than 140 characters.' }),
  amount: z.coerce.number().min(1, { message: 'Please select or enter an amount.'}),
  paymentMethod: z.string({ required_error: 'Please select a payment method.' }),
});

type HypeFormValues = z.infer<typeof hypeFormSchema>;

const amounts = [1000, 2000, 5000, 10000];
const paymentMethods = ['Paystack', 'Flutterwave', 'Stripe'];

function Leaderboard({ tippers }: { tippers: Tipper[] }) {
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
        <ul className="space-y-4">
          {tippers.map((tipper, index) => (
            <li key={tipper.id} className="flex items-center gap-4">
              <span className="font-bold text-lg text-muted-foreground">{index + 1}</span>
              <Avatar>
                <AvatarImage src={tipper.avatarUrl} alt={tipper.name} data-ai-hint="person portrait" />
                <AvatarFallback>{tipper.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{tipper.name}</p>
                <p className="text-sm text-muted-foreground">
                  ₦{tipper.amount.toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EventDetails({ event, leaderboard }: { event: ClubEvent, leaderboard: Tipper[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<HypeFormValues>({
    resolver: zodResolver(hypeFormSchema),
    defaultValues: {
      name: '',
      message: '',
    },
  });

  const selectedAmount = form.watch('amount');
  const [customAmountActive, setCustomAmountActive] = React.useState(false);

  function onSubmit(data: HypeFormValues) {
    if (!event) return;
    
    // Simulate API call and data update
    addHype({
      eventId: event.id,
      senderName: data.name,
      message: data.message,
      amount: data.amount,
    });

    toast({
      title: 'Hype Sent! 🎉',
      description: `Your message and ₦${data.amount.toLocaleString()} have been sent to ${event.hypeman.name}.`,
    });
    form.reset();
    setCustomAmountActive(false);
  }

  return (
    <main className="container py-8 md:py-12">
      <div className="grid gap-12 md:grid-cols-5 lg:grid-cols-3">
        <div className="md:col-span-3 lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-primary/20">
            <Image
              src={event.imageUrl}
              alt={event.clubName}
              width={800}
              height={400}
              className="w-full object-cover h-64"
              data-ai-hint="nightclub party"
            />
            <CardHeader>
              <CardTitle className="text-3xl font-headline">{event.clubName}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Hype hosted by {event.hypeman.name}
              </CardDescription>
              <CardDescription className="flex items-center gap-2 pt-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-wrap gap-2">
               <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Go Back
               </Button>
               <Button variant="outline" asChild>
                  <Link href={`/event/${event.id}/qr`}>
                      <QrCode className="mr-2 h-4 w-4"/>
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><User /> Your Name/Nickname</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Big T" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                                // Don't set field value yet, wait for input
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
                              min="1"
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2"><Wallet /> Payment Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            {paymentMethods.map((method) => (
                              <FormItem key={method} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={method} />
                                </FormControl>
                                <FormLabel className="font-normal">{method}</FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full glowing-accent-btn">
                    Send Hype
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <Leaderboard tippers={leaderboard} />
        </div>
      </div>
    </main>
  );
}

// This is now a Server Component that fetches data and renders the client component.
export default function EventPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const event = getEventById(params.id);
  
  if (!event) {
    notFound();
  }

  const leaderboard = getLeaderboardForEvent(params.id);

  return (
    <>
      <Header />
      <EventDetails event={event} leaderboard={leaderboard} />
    </>
  );
}
