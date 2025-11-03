'use client';

import * as React from 'react';
import { HypeConnectLogo } from '@/components/icons';

const hypePhrases = [
  'Connecting the crowd...',
  'Writing awesome hypes...',
  'Getting the party started...',
  'Tuning the vibes...',
  'Prepping the shoutouts...',
];

export default function Loading() {
  const [currentPhrase, setCurrentPhrase] = React.useState(hypePhrases[0]);

  React.useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      index = (index + 1) % hypePhrases.length;
      setCurrentPhrase(hypePhrases[index]);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute h-full w-full animate-pulse rounded-full bg-primary/30" />
        <HypeConnectLogo className="relative h-12 w-12 text-primary neon-glow-primary" />
      </div>
      <p className="mt-4 animate-pulse text-lg font-semibold text-muted-foreground transition-all">
        {currentPhrase}
      </p>
    </div>
  );
}
