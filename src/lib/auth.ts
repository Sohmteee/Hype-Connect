import crypto from 'crypto';

/**
 * Validate Paystack webhook signature
 */
export function validatePaystackWebhook(
  body: string,
  signature: string
): boolean {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex');

    return hash === signature;
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
}
