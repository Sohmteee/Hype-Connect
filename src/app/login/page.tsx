
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Header } from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';
import { HypeConnectLogo } from '@/components/icons';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useDoc, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<{ roles: ('hypeman' | 'spotlight')[] }>(userDocRef);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  React.useEffect(() => {
    if (!isUserLoading && user && userProfile) {
      // If user has 'hypeman' role, go to hypeman dashboard, otherwise user dash.
      if (userProfile.roles?.includes('hypeman')) {
        router.push('/dashboard');
      } else {
        router.push('/dashboard/user');
      }
    }
  }, [user, userProfile, isUserLoading, router]);

  function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    initiateEmailSignIn(auth, data.email, data.password);
    
    toast({
      title: 'Logging In...',
      description: 'Please wait while we check your credentials.',
    });
    
    setTimeout(() => {
      if(!user) { // If user is still not logged in after 3s
        setIsSubmitting(false);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Please check your email and password.",
        })
      }
    }, 3000)
  }

  if (isUserLoading || (user && !userProfile)) {
      return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading your experience...</p>
        </div>
      );
  }

  return (
    <>
      <Header />
      <main className="container flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <HypeConnectLogo className="h-12 w-12 text-primary neon-glow-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
              Log in to your HypeConnect account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@awesome.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="********"
                            {...field}
                            className="pr-10"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                          <span className="sr-only">
                            {showPassword ? 'Hide password' : 'Show password'}
                          </span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="w-full glowing-accent-btn" disabled={isSubmitting}>
                   {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin mr-2" />
                            Signing In...
                        </>
                    ) : (
                        'Log In'
                    )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-accent hover:underline">
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}

    