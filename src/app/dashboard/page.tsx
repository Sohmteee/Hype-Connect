'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Check,
  CheckCheck,
  DollarSign,
  Loader2,
  Sparkles,
  Wallet as WalletIcon,
  Download,
} from 'lucide-react';
import { getHypesForEvent } from '@/lib/data';
import type { Hype } from '@/lib/types';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

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
  const eventId = 'evt-1'; // Hardcoded for demo
  const [hypes, setHypes] = React.useState<Hype[]>([]);
  const [selectedHypes, setSelectedHypes] = React.useState<Hype[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const initialHypes = getHypesForEvent(eventId);
    setHypes(initialHypes);
  }, []);
  
  const totalEarnings = hypes.reduce((sum, hype) => sum + hype.amount, 0);

  const handleSelectHype = (hype: Hype, isSelected: boolean) => {
    setSelectedHypes((prev) =>
      isSelected ? [...prev, hype] : prev.filter((h) => h.id !== hype.id)
    );
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

  return (
    <>
      <Header />
      <main className="container py-8 md:py-12">
        <h1 className="text-4xl font-bold tracking-tighter mb-8 font-headline">
          MC Gusto&apos;s Dashboard
        </h1>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold">Incoming Hypes</h2>
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
