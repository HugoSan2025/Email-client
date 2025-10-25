'use server';

import { generateEmailFromClientCode, GenerateEmailOutput } from '@/ai/flows/generate-email-from-client-code';
import { enhanceEmailDraft, EnhanceEmailDraftOutput } from '@/ai/flows/enhance-email-drafting-with-ai-suggestions';


export async function getEmailData(clientCode: string): Promise<GenerateEmailOutput> {
  if (!clientCode.trim()) {
    return { subject: '', body: '', recipientEmails: [] };
  }
  try {
    const result = await generateEmailFromClientCode({ clientCode: clientCode });
    return result;
  } catch (error) {
    console.error('Error in getEmailData action:', error);
    // On error, return an empty structure so the frontend doesn't break
    return { subject: '', body: '', recipientEmails: [] };
  }
}

export async function enhanceEmail(emailBody: string): Promise<EnhanceEmailDraftOutput> {
  if (!emailBody.trim()) {
    return { suggestedImprovements: emailBody };
  }
  try {
    const result = await enhanceEmailDraft({ emailDraft: emailBody });
    return result;
  } catch (error) {
    console.error('Error in enhanceEmail action:', error);
    // On error, return original body
    return { suggestedImprovements: emailBody };
  }
}
