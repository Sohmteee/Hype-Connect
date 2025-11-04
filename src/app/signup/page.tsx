
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth, useFirebase } from '@/firebase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';


const signupFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  accountType: z.enum(['spotlight', 'hypeman'], {
    required_error: 'You need to select an account type.',
  }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      accountType: 'spotlight',
    },
  });

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);
    try {
        const methods = await fetchSignInMethodsForEmail(auth, data.email);
        
        if (methods.length > 0) {
            // Email exists, sign in and update role
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: data.name });

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                roles: arrayUnion(data.accountType),
                name: data.name // Update name in firestore as well
            });

            toast({
                title: 'Account Updated!',
                description: `Welcome back, ${data.name}! Your new role has been added.`
            });
        } else {
            // New user, create account
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: data.name });

            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, {
                id: user.uid,
                name: data.name,
                email: user.email,
                roles: [data.accountType],
            });
            toast({
                title: 'Account Created! 🎉',
                description: `Welcome, ${data.name}! Redirecting you now...`,
            });
        }

        // Redirect after successful sign-up or update
        if (data.accountType === 'hypeman') {
            router.push('/dashboard');
        } else {
            router.push('/dashboard/user');
        }

    } catch (error: any) {
        console.error("Signup/Update Error:", error);
        let description = "Could not create or update your account.";
        if (error.code === 'auth/wrong-password') {
            description = "The password you entered is incorrect. Please try again."
        } else if (error.code === 'auth/email-already-in-use' && methods.length === 0) {
            description = "This email is already in use with a different sign-in method."
        }
        
        toast({
            variant: "destructive",
            title: "Something went wrong",
            description: description,
        });
    } finally {
        setIsSubmitting(false);
    }
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
            <CardTitle className="text-2xl font-headline">Create Your Account</CardTitle>
            <CardDescription>
              Join the HypeConnect community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Choose Your Role</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="spotlight" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              I want to send hype & book videos (Spotlight)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="hypeman" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              I'm a Hypeman & want to host events
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name / Stage Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MC Gusto" {...field} />
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
                            Creating Account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-accent hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
