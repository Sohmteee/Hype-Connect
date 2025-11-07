"use server";
/**
 * @fileOverview Generates a personalized "Hype Badge" for a user after they send a hype.
 *
 * - generateHypeBadge - A function that generates the badge image.
 * - GenerateHypeBadgeInput - The input type for the generateHypeBadge function.
 * - GenerateHypeBadgeOutput - The return type for the generateHypeBadge function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateHypeBadgeInputSchema = z.object({
  senderName: z.string().describe("The name of the person who sent the hype."),
  eventName: z.string().describe("The name of the event."),
  hypemanName: z.string().describe("The name of the hypeman."),
  amount: z.number().describe("The amount of the hype."),
});

export type GenerateHypeBadgeInput = z.infer<
  typeof GenerateHypeBadgeInputSchema
>;

const GenerateHypeBadgeOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated badge image."),
});

export type GenerateHypeBadgeOutput = z.infer<
  typeof GenerateHypeBadgeOutputSchema
>;

function createHypeBadgeSvg(input: GenerateHypeBadgeInput): string {
  const { senderName, eventName, hypemanName, amount } = input;
  const formattedAmount = `₦${amount.toLocaleString()}`;

  const HypeSonoveaLogoString = `
      <g transform="translate(20, 20)">
          <g transform="scale(1.2)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="hsl(var(--primary))" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
          </g>
          <text x="35" y="22" fill="#D1B0FF" font-size="16" font-weight="700">
              HypeSonovea
          </text>
      </g>
    `;

  const svgString = `
        <svg
            width="400"
            height="200"
            viewBox="0 0 400 200"
            xmlns="http://www.w3.org/2000/svg"
            style="font-family: 'Space Grotesk', sans-serif;"
        >
            <defs>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&amp;display=swap');
                </style>
                <linearGradient id="backgroundGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#120c18" />
                    <stop offset="100%" stop-color="#0a0014" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <rect width="400" height="200" rx="10" fill="url(#backgroundGradient)" stroke="#4a1a7a" stroke-width="2" />

            ${HypeSonoveaLogoString}

            <text x="200" y="75" text-anchor="middle" fill="white" font-size="24" font-weight="700">
                ${senderName}
            </text>
            <text x="200" y="100" text-anchor="middle" fill="#aaa" font-size="14">
                just sent some hype!
            </text>

            <text x="200" y="135" text-anchor="middle" fill="#9f54ff" font-size="28" font-weight="700" filter="url(#glow)">
                ${formattedAmount}
            </text>

            <line x1="20" y1="160" x2="380" y2="160" stroke="#2a1d3d" stroke-width="1" />

            <text x="20" y="180" fill="#aaa" font-size="12">
                At ${eventName}
            </text>
            <text x="380" y="180" text-anchor="end" fill="#aaa" font-size="12">
                MC: ${hypemanName}
            </text>
        </svg>
    `;
  return svgString;
}

export async function generateHypeBadge(
  input: GenerateHypeBadgeInput
): Promise<GenerateHypeBadgeOutput> {
  return generateHypeBadgeFlow(input);
}

const generateHypeBadgeFlow = ai.defineFlow(
  {
    name: "generateHypeBadgeFlow",
    inputSchema: GenerateHypeBadgeInputSchema,
    outputSchema: GenerateHypeBadgeOutputSchema,
  },
  async (input) => {
    // Generate SVG string directly
    const svgString = createHypeBadgeSvg(input);

    // Base64 encode the SVG string
    const base64Svg = Buffer.from(svgString).toString("base64");

    // Create a data URI
    const imageUrl = `data:image/svg+xml;base64,${base64Svg}`;

    return { imageUrl };
  }
);
