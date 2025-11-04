'use server';

import { generateHypemanContentSuggestions } from '@/ai/flows/hypeman-content-suggestions';
import {
  createEventSchema,
  updateProfileSchema,
  createHypeMessageSchema,
  withdrawalSchema,
} from '@/lib/schemas';
import {
  createEvent,
  getEvent,
  getActiveEvents,
  updateEvent,
  deactivateEvent,
} from '@/services/firestore/events';
import {
  createProfile,
  getProfile,
  getUserProfiles,
  updateProfile,
} from '@/services/firestore/users';
import {
  createHypeMessage,
  getHypeMessages,
  updateHypeStatus,
  getLeaderboard,
} from '@/services/firestore/hypes';
import {
  getEarnings,
  createWithdrawal,
  getWithdrawalHistory,
} from '@/services/firestore/earnings';
import { PaystackService } from '@/services/payment/paystack';

// ==================== AI Actions ====================

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

// ==================== Event Actions ====================

export async function createEventAction(userId: string, formData: unknown) {
  try {
    const validatedData = createEventSchema.parse(formData);
    const eventData = {
      ...validatedData,
      hypemanProfileId: userId,
    };
    const event = await createEvent(userId, eventData);
    return { success: true, data: event };
  } catch (error) {
    console.error('Create event error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create event' };
  }
}

export async function getEventsAction(limit: number = 20, offset: number = 0) {
  try {
    const events = await getActiveEvents(limit, offset);
    return { success: true, data: events };
  } catch (error) {
    console.error('Get events error:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

export async function getEventAction(eventId: string) {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    return { success: true, data: event };
  } catch (error) {
    console.error('Get event error:', error);
    return { success: false, error: 'Failed to fetch event' };
  }
}

export async function updateEventAction(userId: string, eventId: string, formData: unknown) {
  try {
    const updates = formData as Record<string, any>;
    const event = await updateEvent(eventId, userId, updates);
    return { success: true, data: event };
  } catch (error) {
    console.error('Update event error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update event' };
  }
}

export async function deactivateEventAction(userId: string, eventId: string) {
  try {
    const event = await deactivateEvent(eventId, userId);
    return { success: true, data: event };
  } catch (error) {
    console.error('Deactivate event error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to deactivate event' };
  }
}

// ==================== Profile Actions ====================

export async function createProfileAction(userId: string, formData: unknown) {
  try {
    const validatedData = createEventSchema.parse(formData);
    const profile = await createProfile(userId, validatedData as any);
    return { success: true, data: profile };
  } catch (error) {
    console.error('Create profile error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create profile' };
  }
}

export async function getProfilesAction(userId: string) {
  try {
    const profiles = await getUserProfiles(userId);
    return { success: true, data: profiles };
  } catch (error) {
    console.error('Get profiles error:', error);
    return { success: false, error: 'Failed to fetch profiles' };
  }
}

export async function getProfileAction(userId: string, profileId: string) {
  try {
    const profile = await getProfile(userId, profileId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    return { success: true, data: profile };
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, error: 'Failed to fetch profile' };
  }
}

export async function updateProfileAction(
  userId: string,
  profileId: string,
  formData: unknown
) {
  try {
    const validatedData = updateProfileSchema.parse(formData);
    await updateProfile(userId, profileId, validatedData as any);
    return { success: true, message: 'Profile updated' };
  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update profile' };
  }
}

// ==================== Hype Message Actions ====================

export async function submitHypeAction(
  userId: string,
  eventId: string,
  formData: unknown
) {
  try {
    const validatedData = createHypeMessageSchema.parse(formData);

    // Initialize Paystack payment
    const email = formData instanceof Object ? (formData as any).email : '';
    if (!email) {
      return { success: false, error: 'Email is required for payment' };
    }

    const paymentInit = await PaystackService.initializePayment(
      validatedData.amount,
      email,
      {
        eventId,
        userId,
        message: validatedData.message,
      }
    );

    if (!paymentInit.status) {
      return { success: false, error: 'Failed to initialize payment' };
    }

    // Create hype message with pending status
    const hypeMessage = await createHypeMessage(
      eventId,
      {
        userId,
        profileId: userId,
        message: validatedData.message,
        amount: validatedData.amount,
        senderName: validatedData.senderName,
      },
      paymentInit.data.reference
    );

    return {
      success: true,
      data: {
        hypeMessage,
        paymentUrl: paymentInit.data.authorization_url,
      },
    };
  } catch (error) {
    console.error('Submit hype error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to submit hype' };
  }
}

export async function getHypesAction(eventId: string, limit: number = 50, offset: number = 0) {
  try {
    const hypes = await getHypeMessages(eventId, limit, offset);
    return { success: true, data: hypes };
  } catch (error) {
    console.error('Get hypes error:', error);
    return { success: false, error: 'Failed to fetch hypes' };
  }
}

export async function markHypeAsHypedAction(
  userId: string,
  eventId: string,
  hypeId: string
) {
  try {
    // Verify user owns the event before allowing status update
    const event = await getEvent(eventId);
    if (!event || event.hypemanProfileId !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await updateHypeStatus(eventId, hypeId, 'hyped');
    return { success: true, message: 'Hype marked as hyped' };
  } catch (error) {
    console.error('Mark hype error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update hype' };
  }
}

export async function getLeaderboardAction(eventId: string, limit: number = 20) {
  try {
    const leaderboard = await getLeaderboard(eventId, limit);
    return { success: true, data: leaderboard };
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return { success: false, error: 'Failed to fetch leaderboard' };
  }
}

// ==================== Earnings & Withdrawal Actions ====================

export async function getEarningsAction(userId: string, profileId: string) {
  try {
    const earnings = await getEarnings(userId, profileId);
    return { success: true, data: { earnings } };
  } catch (error) {
    console.error('Get earnings error:', error);
    return { success: false, error: 'Failed to fetch earnings' };
  }
}

export async function requestWithdrawalAction(
  userId: string,
  profileId: string,
  formData: unknown
) {
  try {
    const validatedData = withdrawalSchema.parse(formData);
    const withdrawal = await createWithdrawal(userId, profileId, validatedData);
    return { success: true, data: withdrawal };
  } catch (error) {
    console.error('Request withdrawal error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to request withdrawal' };
  }
}

export async function getWithdrawalHistoryAction(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const history = await getWithdrawalHistory(userId, limit, offset);
    return { success: true, data: history };
  } catch (error) {
    console.error('Get withdrawal history error:', error);
    return { success: false, error: 'Failed to fetch withdrawal history' };
  }
}
