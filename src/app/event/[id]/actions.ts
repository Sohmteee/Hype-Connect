'use server';

import { generateHypeBadge } from "@/ai/flows/generate-hype-badge";

export async function generateHypeBadgeAction(input: {
  senderName: string;
  eventName: string;
  hypemanName: string;
  amount: number;
}) {
  try {
    const result = await generateHypeBadge(input);
    return { success: true, imageUrl: result.imageUrl };
  } catch (error) {
    console.error("Error generating hype badge:", error);
    return { success: false, error: "Could not generate your hype badge." };
  }
}
