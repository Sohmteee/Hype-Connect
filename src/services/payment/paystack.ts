import crypto from "crypto";

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    status: "success" | "failed" | "pending";
    metadata?: {
      eventId?: string;
      userId?: string;
      [key: string]: any;
    };
  };
}

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

if (!PAYSTACK_SECRET_KEY) {
  console.warn("PAYSTACK_SECRET_KEY is not set in environment variables");
}

export class PaystackService {
  /**
   * Initialize a payment transaction
   */
  static async initializePayment(
    amount: number, // in Naira
    email: string,
    metadata?: Record<string, any>
  ): Promise<PaystackInitializeResponse> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const callbackUrl = `${appUrl}/payment/callback`;

      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            amount: amount * 100, // Paystack expects amount in kobo
            metadata,
            callback_url: callbackUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Paystack API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Paystack initialize payment error:", error);
      throw new Error("Failed to initialize payment");
    }
  }

  /**
   * Verify a payment transaction
   */
  static async verifyPayment(
    reference: string
  ): Promise<PaystackVerifyResponse> {
    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Paystack API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Paystack verify payment error:", error);
      throw new Error("Failed to verify payment");
    }
  }

  /**
   * Validate webhook signature from Paystack
   */
  static validateWebhookSignature(body: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(body)
        .digest("hex");

      return hash === signature;
    } catch (error) {
      console.error("Webhook signature validation error:", error);
      return false;
    }
  }

  /**
   * Create a transfer recipient (for payouts)
   */
  static async createTransferRecipient(
    type: "nuban", // Nigerian bank account
    accountNumber: string,
    bankCode: string,
    accountName: string
  ): Promise<any> {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          account_number: accountNumber,
          bank_code: bankCode,
          name: accountName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Paystack API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Paystack create transfer recipient error:", error);
      throw new Error("Failed to create transfer recipient");
    }
  }

  /**
   * Initiate a transfer (payout)
   */
  static async initiateTransfer(
    source: "balance", // We transfer from our Paystack balance
    recipientCode: string,
    amount: number, // in Naira
    reference: string,
    reason?: string
  ): Promise<any> {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          recipient: recipientCode,
          amount: amount * 100, // Convert to kobo
          reference,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Paystack API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Paystack initiate transfer error:", error);
      throw new Error("Failed to initiate transfer");
    }
  }

  /**
   * Get bank list for account verification
   */
  static async getBankList(): Promise<any> {
    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/bank`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Paystack API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Paystack get bank list error:", error);
      throw new Error("Failed to get bank list");
    }
  }

  /**
   * Resolve account details
   */
  static async resolveAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<any> {
    try {
      const url = `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
      console.log(
        `[Paystack] Resolving account: ${accountNumber} with bank code: ${bankCode}`
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log(
        `[Paystack] Resolve response status: ${response.status}`,
        data
      );

      if (!response.ok) {
        console.error(
          `[Paystack] API error - Status: ${response.status}, Message: ${
            data?.message || response.statusText
          }`
        );
        throw new Error(
          `Paystack API error: ${data?.message || response.statusText}`
        );
      }

      return data;
    } catch (error) {
      console.error("Paystack resolve account error:", error);
      throw error;
    }
  }

  /**
   * Get list of banks from Paystack
   * Use this to get correct bank codes for account resolution
   */
  static async getBanks(): Promise<any[]> {
    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/bank?currency=NGN&perPage=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log(
        `[Paystack] Got ${data.data?.length || 0} banks from Paystack`
      );

      if (!response.ok) {
        throw new Error(
          `Paystack API error: ${data?.message || response.statusText}`
        );
      }

      // Sort by name and return
      return (data.data || []).sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error("Paystack get banks error:", error);
      throw error;
    }
  }
}
