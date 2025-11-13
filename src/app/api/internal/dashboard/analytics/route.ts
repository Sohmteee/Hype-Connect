import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/services/admin/auth";
import { getAdminFirestore } from "@/services/firebase-admin";
import {
  getPaymentTransactionStats,
  getRecentFailedPayments,
} from "@/services/firebase/payment-transactions";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();

    // Get payment stats
    const paymentStats = await getPaymentTransactionStats();

    // Get platform earnings
    const platformEarningsDoc = await db
      .collection("platform-earnings")
      .doc("main")
      .get();

    const platformEarnings = platformEarningsDoc.exists
      ? platformEarningsDoc.data()
      : {
          bookingFees: 0,
          hypeFees: 0,
          totalEarned: 0,
        };

    // Get recent failed payments
    const recentFailures = await getRecentFailedPayments(24);

    // Get hypes stats - top earning hypemen
    const usersSnapshot = await db
      .collection("users")
      .where("type", "==", "hypeman")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const topHypemen = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const walletDoc = await db.collection("wallets").doc(doc.id).get();

        const balance = walletDoc.exists ? walletDoc.data()?.balance || 0 : 0;
        const totalEarned = walletDoc.exists
          ? walletDoc.data()?.totalEarned || 0
          : 0;

        return {
          id: doc.id,
          displayName: doc.data().displayName,
          balance,
          totalEarned,
          createdAt: doc.data().createdAt,
        };
      })
    );

    // Sort by totalEarned
    topHypemen.sort((a, b) => b.totalEarned - a.totalEarned);

    // Get withdrawal stats
    const withdrawalsSnapshot = await db.collection("withdrawals").get();

    let totalWithdrawalRequests = 0;
    let pendingWithdrawals = 0;
    let completedWithdrawals = 0;
    let totalWithdrawn = 0;

    withdrawalsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalWithdrawalRequests++;

      if (
        data.status === "processing" ||
        data.status === "pending_verification"
      ) {
        pendingWithdrawals++;
      } else if (data.status === "completed") {
        completedWithdrawals++;
        totalWithdrawn += data.amount || 0;
      }
    });

    // Calculate success rate
    const paymentSuccessRate =
      paymentStats.total > 0
        ? Math.round((paymentStats.completed / paymentStats.total) * 100 * 10) /
          10
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        payments: {
          ...paymentStats,
          successRate: paymentSuccessRate,
          recentFailures: recentFailures.length,
        },
        platformEarnings,
        withdrawals: {
          totalRequests: totalWithdrawalRequests,
          pending: pendingWithdrawals,
          completed: completedWithdrawals,
          totalWithdrawn,
        },
        topHypemen: topHypemen.slice(0, 10),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Analytics] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
