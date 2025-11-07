"use client";

import Link from "next/link";
import { DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WalletProps {
  earnings: number;
}

export default function Wallet({ earnings }: WalletProps) {
  return (
    <Card className="glow-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          Wallet
        </CardTitle>
        <CardDescription>Your earnings and payouts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-green-400">
            ₦{earnings.toLocaleString()}
          </p>
        </div>

        <Button asChild className="w-full glowing-accent-btn">
          <Link href="/dashboard/withdraw">
            Withdraw
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <div className="text-xs text-muted-foreground pt-4 border-t border-border/50">
          <p>📊 Earnings update in real-time</p>
          <p className="mt-1">⏱️ Withdrawals processed within 2-4 days</p>
        </div>
      </CardContent>
    </Card>
  );
}
