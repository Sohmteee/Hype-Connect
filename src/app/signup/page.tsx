'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '../loading';

// This page is now a redirect.
export default function SignupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return <Loading />;
}
