'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { HypeConnectLogo } from '@/components/icons';
import { signUpWithEmail } from '@/lib/auth';

const signupFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['spotlight', 'hypeman', 'both'], {
    required_error: 'You need to select an account type.',
  }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);
    try {
      await signUpWithEmail(data.name, data.email, data.password, data.role);
      toast({
        title: 'Account Created! 🎉',
        description: "Welcome to HypeConnect! Please log in to continue.",
      });
      router.push('/login');
    } catch (error: any) {
      console.error('Signup Error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email is already registered. Please log in.'
            : 'An unexpected error occurred. Please try again.',
      });
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="container flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <HypeConnectLogo className="h-16 w-16 mx-auto text-primary neon-glow-primary" />
            <CardTitle className="text-2xl font-headline mt-4">
              Create Your Account
            </CardTitle>
            <CardDescription>
              Join the community and start hyping!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User /> Full Name / Stage Name
                      </FormLabel>
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail /> Email
                      </FormLabel>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock /> Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                       <FormDescription>
                        Must be at least 6 characters long.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        <Users /> Account Type
                      </FormLabel>
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
                              Spotlight (I want to send hypes)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="hypeman" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Hypeman (I want to receive hypes)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="both" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Both (I want to do both)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full glowing-accent-btn"
                  disabled={isSubmitting}
                >
                   {isSubmitting && (
                    <Loader2 className="animate-spin mr-2" />
                  )}
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?&nbsp;
              <Link
                href="/login"
                className="text-primary hover:underline font-semibold"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
