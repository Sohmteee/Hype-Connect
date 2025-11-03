'use server';

import { generateHypemanContentSuggestions } from '@/ai/flows/hypeman-content-suggestions';

export async function getAiSuggestionsAction(
  messages: string[],
  currentActivity: string
) {
  if (messages.length === 0) {
    return { success: false, error: 'No messages selected.' };
  }
  
  try {
    const response = await generateHypemanContentSuggestions({
      messages: messages.join('\n- '),
      currentActivity: currentActivity,
    });
    return { success: true, suggestions: response.suggestions };
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    return { success: false, error: 'Failed to generate suggestions. Please try again.' };
  }
}
