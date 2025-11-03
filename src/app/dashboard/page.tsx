'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import {
  Check,
  CheckCheck,
  DollarSign,
  Loader2,
  Sparkles,
  Wallet as WalletIcon,
  Download,
  PlusCircle,
  Building,
  Upload,
  PowerOff,
  MapPin,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { getHypesForEvent, addEvent, getActiveEventsByHypeman, endEvent } from '@/lib/data';
import type { Hype, ClubEvent } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/layout/Header';
import { getAiSuggestionsAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const eventFormSchema = z.object({
  clubName: z.string().min(3, { message: 'Club name must be at least 3 characters.' }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  image: z
    .any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

function CreateEventDialog({ onEventCreated }: { onEventCreated: (newEvent: ClubEvent) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      clubName: '',
      location: '',
      image: undefined,
    },
  });

  function onSubmit(data: EventFormValues) {
     const imageUrl = URL.createObjectURL(data.image[0]);

    const newEvent = addEvent({
      clubName: data.clubName,
      location: data.location,
      imageUrl: imageUrl,
    });
    toast({
      title: 'Event Created! 🚀',
      description: `${data.clubName} is now live.`,
    });
    onEventCreated(newEvent);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Create New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Event</DialogTitle>
          <DialogDescription>
            Fill in the details to start a new hype session.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="clubName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Building/> Club Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Club Neon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><MapPin/> Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Lagos, NG" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="image"
              render={({ field }) => {
                const { onChange, value, ...rest } = field;
                return (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Upload/> Event Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(event) => {
                          onChange(event.target.files);
                        }}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <DialogFooter>
              <Button type="submit" className="w-full glowing-accent-btn">
                Create Event
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function Wallet({ earnings }: { earnings: number }) {
  return (
    <Card className="bg-gradient-to-tr from-primary/80 to-primary">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-primary-foreground">
          Total Earnings
        </CardTitle>
        <WalletIcon className="h-4 w-4 text-primary-foreground/80" />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-primary-foreground">
          ₦{earnings.toLocaleString()}
        </div>
        <p className="text-xs text-primary-foreground/80 mt-1">
          Available for withdrawal
        </p>
         <Button variant="secondary" size="sm" className="mt-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Download className="mr-2 h-4 w-4" />
            Withdraw Funds
        </Button>
      </CardContent>
    </Card>
  );
}

function AiSuggestions({
  selectedHypes,
  onSuggestion,
}: {
  selectedHypes: Hype[];
  onSuggestion: () => void;
}) {
  const [suggestions, setSuggestions] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setSuggestions('');

    const messageTexts = selectedHypes.map((hype) => `From ${hype.senderName} (₦${hype.amount}): "${hype.message}"`);
    const result = await getAiSuggestionsAction(messageTexts, 'DJ set is live');

    setIsLoading(false);
    if (result.success) {
      setSuggestions(result.suggestions!);
      onSuggestion();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <Sparkles className="neon-glow" />
          AI Hype Suggestions
        </CardTitle>
        <CardDescription>
          Select messages to get AI-powered shoutout ideas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGetSuggestions}
          disabled={isLoading || selectedHypes.length === 0}
          className="w-full glowing-accent-btn"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            `Generate for ${selectedHypes.length} message(s)`
          )}
        </Button>
        {suggestions && (
          <div className="mt-4 space-y-4 text-sm prose prose-invert prose-p:text-foreground prose-li:text-foreground">
            <h4 className='font-semibold text-base'>Here are some ideas:</h4>
            {suggestions.split('\n').map((line, i) => (
                <p key={i} className="text-muted-foreground">{line.replace(/^\d+\.\s*/, '')}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const hypemanId = 'hm-1'; // Hardcoded for demo
  const [hypes, setHypes] = React.useState<Hype[]>([]);
  const [selectedHypes, setSelectedHypes] = React.useState<Hype[]>([]);
  const [activeEvents, setActiveEvents] = React.useState<ClubEvent[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    // In a real app, you'd fetch based on the selected event
    const initialHypes = getHypesForEvent('evt-1');
    setHypes(initialHypes);
    
    // Fetch active events for the current hypeman
    const events = getActiveEventsByHypeman(hypemanId);
    setActiveEvents(events);
  }, []);
  
  const totalEarnings = hypes.reduce((sum, hype) => sum + hype.amount, 0);

  const handleSelectHype = (hype: Hype, isSelected: boolean) => {
    setSelectedHypes((prev) =>
      isSelected ? [...prev, hype] : prev.filter((h) => h.id !== hype.id)
    );
  };
  
  const handleEventCreated = (newEvent: ClubEvent) => {
     setActiveEvents((prev) => [newEvent, ...prev]);
  };

  const handleMarkAsHyped = (hypeId: string) => {
    setHypes((prev) =>
      prev.map((h) => (h.id === hypeId ? { ...h, status: 'hyped' } : h))
    );
    toast({
        title: 'Marked as Hyped!',
        description: 'The crowd loves you!',
    });
  };
  
  const handleEndEvent = (eventId: string) => {
    endEvent(eventId);
    setActiveEvents(prev => prev.filter(e => e.id !== eventId));
    toast({
        title: 'Event Ended',
        description: 'The event is no longer active.',
    });
  };

  return (
    <>
      <Header />
      <main className="container py-8 md:py-12">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold tracking-tighter font-headline">
            MC Gusto&apos;s Dashboard
            </h1>
            <CreateEventDialog onEventCreated={handleEventCreated} />
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Your Active Events</h2>
                 {activeEvents.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {activeEvents.map(event => (
                            <Card key={event.id}>
                                <Image src={event.imageUrl} alt={event.clubName} width={400} height={200} className="rounded-t-lg object-cover h-32 w-full" data-ai-hint="nightclub party" />
                                <CardHeader>
                                    <CardTitle>{event.clubName}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 pt-1"><MapPin className="h-4 w-4" />{event.location}</CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button variant="destructive" className="w-full" onClick={() => handleEndEvent(event.id)}>
                                        <PowerOff className="mr-2" />
                                        End Event
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className='text-center p-8'>
                        <CardDescription>You have no active events.</CardDescription>
                    </Card>
                )}
            </section>
            
            <Separator className="my-8" />
            
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Incoming Hypes for Club Neon</h2>
              <div className="space-y-4">
                {hypes.map((hype) => (
                  <Card
                    key={hype.id}
                    className={`transition-all ${hype.status === 'hyped' ? 'bg-card/50 opacity-60' : 'bg-card'}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-3">
                            <Checkbox
                              id={`select-${hype.id}`}
                              onCheckedChange={(checked) =>
                                handleSelectHype(hype, !!checked)
                              }
                              checked={selectedHypes.some((h) => h.id === hype.id)}
                            />
                            {hype.senderName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {formatDistanceToNow(new Date(hype.timestamp), { addSuffix: true })}
                          </CardDescription>
                        </div>
                        <Badge variant={hype.status === 'hyped' ? "secondary" : "default"} className="text-base">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {hype.amount.toLocaleString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg">{hype.message}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      {hype.status === 'new' ? (
                        <Button onClick={() => handleMarkAsHyped(hype.id)}>
                          <Check className="mr-2 h-4 w-4" />
                          Mark as Hyped
                        </Button>
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <CheckCheck className="mr-2 h-4 w-4 text-green-400" />
                          Hyped!
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <Wallet earnings={totalEarnings} />
            <AiSuggestions 
                selectedHypes={selectedHypes} 
                onSuggestion={() => setSelectedHypes([])} 
            />
          </div>
        </div>
      </main>
    </>
  );
}
