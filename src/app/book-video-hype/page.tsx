
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
import { Button } from '@/components/ui/button';
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
import { useUser } from '@/firebase';

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
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const allEvents = getEvents();
   const hypemen = Array.from(
    new Map(allEvents.map((event) => [event.hypeman.id, event.hypeman])).values()
  );

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: user?.displayName || '',
      email: user?.email || '',
    },
  });

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to book a video hype.',
        variant: 'destructive',
      });
      router.push('/login?redirect=/book-video-hype');
    }
    // Pre-fill form if user data becomes available
    if(user) {
        form.reset({
            name: user.displayName || '',
            email: user.email || '',
            hypemanId: undefined,
            occasion: undefined,
            videoDetails: '',
        });
    }
  }, [user, isUserLoading, router, form, toast]);


  function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    console.log('Video Hype Booking:', data);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Booking Confirmed! 🎬',
        description: `Your request has been sent. You can check its status on your dashboard.`,
      });
      setIsSubmitting(false);
      router.push('/dashboard/user');
    }, 2000);
  }

  if (isUserLoading || !user) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
      </div>
    );
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
                        <FormLabel className="flex items-center gap-2"><User/> Your Name</FormLabel>
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
                            {hypemen.map((hypeman) => (
                              <SelectItem key={hypeman.id} value={hypeman.id}>
                                {hypeman.name}
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
                      <FormLabel className="flex items-center gap-2"><MessageSquare/> Video Details</FormLabel>
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
