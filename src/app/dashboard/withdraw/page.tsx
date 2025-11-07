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
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { getProfilesAction, getEarningsAction, requestWithdrawalAction } from "@/app/dashboard/actions";

interface Profile {
  profileId: string;
  type: string;
  displayName: string;
  stats: {
    earnings: number;
  };
}

interface Bank {
  id: number;
  name: string;
  code: string;
}

export default function WithdrawPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  // State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    withdrawableBalance: 0,
    totalWithdrawn: 0,
  });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  // Load profile data and banks
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const loadData = async () => {
      try {
        // Get profiles
        const profilesResponse = await getProfilesAction(user.uid);
        if (profilesResponse.success && profilesResponse.data) {
          const hypemenProfiles = profilesResponse.data.filter(
            (p: any) => p.type === "hypeman"
          );
          setProfiles(hypemenProfiles);
          if (hypemenProfiles.length > 0) {
            setSelectedProfileId(hypemenProfiles[0].profileId);
          }
        }

        // Get banks from Paystack
        const banksResponse = await fetch("/api/payment/banks");
        if (banksResponse.ok) {
          const banksData = await banksResponse.json();
          if (banksData.success && banksData.data) {
            // Transform Paystack bank data to our format
            const formattedBanks = banksData.data.map((bank: any) => ({
              id: bank.id,
              name: bank.name,
              code: bank.code,
            }));

            // Deduplicate by code (some banks might have duplicate codes)
            const uniqueBanks = formattedBanks.filter((bank: any, index: number, self: any[]) =>
              index === self.findIndex((b: any) => b.code === bank.code)
            );

            // Add test bank for development
            const testBank = {
              id: 999,
              name: "Guaranty Trust Bank (Test)",
              code: "001",
            };

            setBanks([testBank, ...uniqueBanks]);
            console.log(`[WithdrawPage] Loaded ${uniqueBanks.length} unique banks from Paystack + 1 test bank`);
          }
        }
      } catch (error) {
        console.error("Load data error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, router]);

  // Load earnings when profile is selected
  useEffect(() => {
    if (!user || !selectedProfileId) return;

    const loadEarnings = async () => {
      try {
        const response = await getEarningsAction(user.uid, selectedProfileId);
        if (response.success && response.data) {
          setEarnings(response.data);
        }
      } catch (error) {
        console.error("Load earnings error:", error);
      }
    };

    loadEarnings();
  }, [user, selectedProfileId]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Special handling for amount field - format as currency
    if (name === "amount") {
      // Remove all non-numeric characters
      const numericValue = value.replace(/\D/g, "");
      // Format with locale string for display
      const formattedValue = numericValue ? numericValue : "";
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleBankChange = (value: string) => {
    // Find the bank name from the selected bank code
    const selectedBank = banks.find((b) => b.code === value);
    const bankName = selectedBank?.name || "";

    setFormData((prev) => ({
      ...prev,
      bankCode: value,
      bankName: bankName,
      accountName: "", // Reset account name when bank changes
    }));
    setResolvedAccountName("");
    setBankSearchQuery(""); // Reset search when bank selected
  };

  // Resolve account name
  const handleResolveAccount = async () => {
    if (!formData.accountNumber || !formData.bankCode) {
      toast({
        title: "Error",
        description: "Please enter account number and select a bank",
        variant: "destructive",
      });
      return;
    }

    setIsResolvingAccount(true);
    try {
      const response = await fetch("/api/payment/resolve-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: formData.accountNumber,
          bankCode: formData.bankCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResolvedAccountName(data.data.account_name);
        setFormData((prev) => ({
          ...prev,
          accountName: data.data.account_name,
        }));
        toast({
          title: "Account Verified",
          description: `Account name: ${data.data.account_name}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to resolve account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resolve account error:", error);
      toast({
        title: "Error",
        description: "Failed to resolve account",
        variant: "destructive",
      });
    } finally {
      setIsResolvingAccount(false);
    }
  };

  // Submit withdrawal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedProfileId) return;

    if (!formData.amount || !formData.bankCode || !formData.accountNumber || !formData.accountName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > earnings.withdrawableBalance) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await requestWithdrawalAction(user.uid, selectedProfileId, {
        amount,
        bankName: formData.bankName,
        bankCode: formData.bankCode,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Withdrawal of ₦${amount.toLocaleString()} requested. Processing...`,
        });
        setFormData({ amount: "", bankCode: "", bankName: "", accountNumber: "", accountName: "" });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to request withdrawal",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Error",
        description: "Failed to request withdrawal",
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

  if (profiles.length === 0) {
    return (
      <>
        <Header />
        <main className="container py-12">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Withdraw Earnings</h1>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to be a Hypeman to withdraw earnings. Please create a Hypeman profile first.
            </AlertDescription>
          </Alert>
        </main>
      </>
    );
  }

  const selectedProfile = profiles.find((p) => p.profileId === selectedProfileId);

  return (
    <>
      <Header />
      <main className="container py-8 md:py-12 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Withdraw Earnings</h1>
        </div>

        <div className="grid gap-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  ₦{earnings.totalEarned.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Withdrawn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  ₦{earnings.totalWithdrawn.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Withdrawable Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  ₦{earnings.withdrawableBalance.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>
                Enter your bank details to withdraw earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Selection */}
                <div className="space-y-2">
                  <Label htmlFor="profile">Select Profile</Label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger id="profile">
                      <SelectValue placeholder="Select profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.profileId} value={profile.profileId}>
                          {profile.displayName} ({profile.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Withdrawal Amount (₦)
                    <span className="text-xs text-muted-foreground ml-2">
                      Available: ₦{earnings.withdrawableBalance.toLocaleString()}
                    </span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-semibold pointer-events-none">
                      ₦
                    </span>
                    <Input
                      id="amount"
                      name="amount"
                      type="text"
                      placeholder="0"
                      value={formData.amount ? parseInt(formData.amount).toLocaleString() : ""}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="pl-7 pr-8 text-left font-semibold tracking-wide"
                    />
                    {formData.amount && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, amount: "" }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum withdrawal: ₦1,000
                  </p>
                </div>

                {/* Bank Selection */}
                <div className="space-y-2">
                  <Label htmlFor="bank">Select Bank</Label>
                  <Select value={formData.bankCode} onValueChange={handleBankChange}>
                    <SelectTrigger id="bank">
                      <SelectValue placeholder={banks.length === 0 ? "Loading banks..." : "Select your bank"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {banks.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Loading banks...
                        </div>
                      ) : (
                        <>
                          <div className="p-2 sticky top-0 bg-background border-b">
                            <Input
                              placeholder="Search banks..."
                              value={bankSearchQuery}
                              onChange={(e) => setBankSearchQuery(e.target.value)}
                              className="h-8 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {(() => {
                            const filteredBanks = banks.filter((bank) =>
                              bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                              bank.code.includes(bankSearchQuery)
                            );
                            return (
                              <>
                                {filteredBanks.map((bank) => (
                                  <SelectItem key={bank.code} value={bank.code}>
                                    {bank.name}
                                  </SelectItem>
                                ))}
                                {filteredBanks.length === 0 && (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    No banks found
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Number */}
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      placeholder="e.g., 0123456789"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      disabled={isSubmitting || isResolvingAccount}
                      maxLength={10}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResolveAccount}
                      disabled={
                        isSubmitting ||
                        isResolvingAccount ||
                        !formData.accountNumber ||
                        !formData.bankCode
                      }
                    >
                      {isResolvingAccount ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Account Name (Read-only, filled after verification) */}
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    placeholder="Account name (auto-filled)"
                    value={formData.accountName}
                    disabled={true}
                    className="bg-muted"
                  />
                  {resolvedAccountName && (
                    <p className="text-xs text-green-400">
                      ✓ Account verified: {resolvedAccountName}
                    </p>
                  )}
                </div>

                {/* Info Alert */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Withdrawals are processed within 2-4 business days. A small processing fee may apply.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.accountName}
                  className="w-full glowing-accent-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Request Withdrawal of ₦${formData.amount || "0"}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
