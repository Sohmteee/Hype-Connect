'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '../loading';

// This page is now a redirect.
export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return <Loading />;
}
