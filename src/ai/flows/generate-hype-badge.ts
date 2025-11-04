'use server';
/**
 * @fileOverview Generates a personalized "Hype Badge" for a user after they send a hype.
 * 
 * - generateHypeBadge - A function that generates the badge image.
 * - GenerateHypeBadgeInput - The input type for the generateHypeBadge function.
 * - GenerateHypeBadgeOutput - The return type for the generateHypeBadge function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { HypeConnectLogo } from '@/components/icons';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';


const GenerateHypeBadgeInputSchema = z.object({
  senderName: z.string().describe('The name of the person who sent the hype.'),
  eventName: z.string().describe('The name of the event.'),
  hypemanName: z.string().describe('The name of the hypeman.'),
  amount: z.number().describe('The amount of the hype.'),
});

export type GenerateHypeBadgeInput = z.infer<typeof GenerateHypeBadgeInputSchema>;

const GenerateHypeBadgeOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated badge image.'),
});

export type GenerateHypeBadgeOutput = z.infer<typeof GenerateHypeBadgeOutputSchema>;

// SVG Component for the Badge
function HypeBadge({ senderName, eventName, hypemanName, amount }: GenerateHypeBadgeInput) {
    const formattedAmount = `₦${amount.toLocaleString()}`;

    return (
        <svg
            width="400"
            height="200"
            viewBox="0 0 400 200"
            xmlns="http://www.w3.org/2000/svg"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
            <defs>
                <style>
                    {`
                        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');
                    `}
                </style>
                <linearGradient id="backgroundGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#120c18" />
                    <stop offset="100%" stopColor="#0a0014" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <rect width="400" height="200" rx="10" fill="url(#backgroundGradient)" stroke="#4a1a7a" strokeWidth="2" />

            <g transform="translate(20, 20)">
                <g transform="scale(1.2)">
                    <HypeConnectLogo />
                </g>
                <text x="35" y="22" fill="#D1B0FF" fontSize="16" fontWeight="700">
                    HypeConnect
                </text>
            </g>

            <text x="200" y="75" textAnchor="middle" fill="white" fontSize="24" fontWeight="700">
                {senderName}
            </text>
            <text x="200" y="100" textAnchor="middle" fill="#aaa" fontSize="14">
                just sent some hype!
            </text>

            <text x="200" y="135" textAnchor="middle" fill="#9f54ff" fontSize="28" fontWeight="700" filter="url(#glow)">
                {formattedAmount}
            </text>

            <line x1="20" y1="160" x2="380" y2="160" stroke="#2a1d3d" strokeWidth="1" />

            <text x="20" y="180" fill="#aaa" fontSize="12">
                At {eventName}
            </text>
            <text x="380" y="180" textAnchor="end" fill="#aaa" fontSize="12">
                MC: {hypemanName}
            </text>
        </svg>
    );
}

export async function generateHypeBadge(input: GenerateHypeBadgeInput): Promise<GenerateHypeBadgeOutput> {
  return generateHypeBadgeFlow(input);
}


const generateHypeBadgeFlow = ai.defineFlow(
  {
    name: 'generateHypeBadgeFlow',
    inputSchema: GenerateHypeBadgeInputSchema,
    outputSchema: GenerateHypeBadgeOutputSchema,
  },
  async (input) => {
    // Render React component to an HTML string
    const svgString = renderToStaticMarkup(React.createElement(HypeBadge, input));
    
    // Base64 encode the SVG string
    const base64Svg = Buffer.from(svgString).toString('base64');
    
    // Create a data URI
    const imageUrl = `data:image/svg+xml;base64,${base64Svg}`;

    return { imageUrl };
  }
);
