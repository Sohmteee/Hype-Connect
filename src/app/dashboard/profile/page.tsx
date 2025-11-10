"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { updateUserProfileAction } from "@/app/dashboard/actions";

export default function ProfilePage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    publicBio: "",
    visibility: "public" as "public" | "private",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  // Load user profile
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const loadProfile = async () => {
      try {
        // User profile is in the user doc directly, not in subcollections anymore
        // We can get it from Firebase Auth's displayName and from Firestore user doc
        setFormData({
          displayName: user.displayName || "",
          publicBio: "",
          visibility: "public" as "public" | "private",
          bankName: "",
          accountNumber: "",
          accountName: "",
        });
      } catch (error) {
        console.error("Load profile error:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, router, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVisibilityChange = (value: "public" | "private") => {
    setFormData((prev) => ({
      ...prev,
      visibility: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!formData.displayName) {
      toast({
        title: "Error",
        description: "Display name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateUserProfileAction(user.uid, {
        displayName: formData.displayName,
        publicBio: formData.publicBio,
        visibility: formData.visibility,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container py-8 md:py-12 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Profile Settings</h1>
        </div>

        <div className="grid gap-6">
          {/* Edit Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Basic Info</TabsTrigger>
                  <TabsTrigger value="payout">Payout Info</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info Tab */}
                  <TabsContent value="info" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        placeholder="Your name or stage name"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="publicBio">Public Bio</Label>
                      <Textarea
                        id="publicBio"
                        name="publicBio"
                        placeholder="Tell people about yourself"
                        value={formData.publicBio}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be visible on your public profile (max 200 characters)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility">Profile Visibility</Label>
                      <Select
                        value={formData.visibility}
                        onValueChange={handleVisibilityChange}
                      >
                        <SelectTrigger id="visibility">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Public profiles can be discovered by other users
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="glowing-accent-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </TabsContent>

                  {/* Payout Info Tab */}
                  <TabsContent value="payout" className="space-y-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This information is used for withdrawals. Keep it accurate and up-to-date.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        name="bankName"
                        placeholder="e.g., Access Bank"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        name="accountNumber"
                        placeholder="e.g., 0123456789"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        name="accountName"
                        placeholder="Account holder's name"
                        value={formData.accountName}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="glowing-accent-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Payout Info"
                      )}
                    </Button>
                  </TabsContent>
                </form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
