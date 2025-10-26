
'use server';

import { enhanceEmailDraft, EnhanceEmailDraftOutput } from '@/ai/flows/enhance-email-drafting-with-ai-suggestions';

// The getEmailData function is no longer needed as the data is handled on the client.

export async function enhanceEmail(emailBody: string): Promise<EnhanceEmailDraftOutput> {
  if (!emailBody.trim()) {
    return { suggestedImprovements: emailBody };
  }
  try {
    const result = await enhanceEmailDraft({ emailDraft: emailBody });
    return result;
  } catch (error) {
    console.error('Error in enhanceEmail action:', error);
    // Return the original body in case of an error with the AI service
    return { suggestedImprovements: emailBody };
  }
}
