'use server';
/**
 * @fileOverview AI-powered tool that suggests ways the hypeman can act on the user-submitted content, to maximize audience engagement.
 *
 * - generateHypemanContentSuggestions - A function that generates suggestions for hypeman content based on user input.
 * - HypemanContentSuggestionsInput - The input type for the generateHypemanContentSuggestions function.
 * - HypemanContentSuggestionsOutput - The return type for the generateHypemanContentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HypemanContentSuggestionsInputSchema = z.object({
  messages: z
    .string()
    .describe('The user submitted messages to be used by the hypeman.'),
  currentActivity: z.string().describe('The current activity happening at the venue.'),
});

export type HypemanContentSuggestionsInput = z.infer<
  typeof HypemanContentSuggestionsInputSchema
>;

const HypemanContentSuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe(
      'A list of suggestions for the hypeman to act on the user-submitted content.'
    ),
});

export type HypemanContentSuggestionsOutput = z.infer<
  typeof HypemanContentSuggestionsOutputSchema
>;

export async function generateHypemanContentSuggestions(
  input: HypemanContentSuggestionsInput
): Promise<HypemanContentSuggestionsOutput> {
  return hypemanContentSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'hypemanContentSuggestionsPrompt',
  input: {schema: HypemanContentSuggestionsInputSchema},
  output: {schema: HypemanContentSuggestionsOutputSchema},
  prompt: `You are a hypeman content suggestion AI.

You are assisting a hypeman who is hosting an event, by providing creative ideas for shoutouts based on messages that have been submitted by people attending the event.

The current activity that is happening at the venue is: {{{currentActivity}}}.

The messages are as follows:
{{{messages}}}

Generate a numbered list of diverse suggestions, tailored to the content of the messages and the current activity.
Each suggestion should aim to amplify audience engagement and create a memorable experience.
Ensure each suggestion is clear, actionable, and suitable for immediate use by the hypeman.
`,
});

const hypemanContentSuggestionsFlow = ai.defineFlow(
  {
    name: 'hypemanContentSuggestionsFlow',
    inputSchema: HypemanContentSuggestionsInputSchema,
    outputSchema: HypemanContentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

