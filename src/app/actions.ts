'use server';

import { generateEmailFromClientCode, GenerateEmailOutput } from '@/ai/flows/generate-email-from-client-code';

export async function getEmailData(clientCode: string): Promise<GenerateEmailOutput> {
  if (!clientCode.trim()) {
    return { subject: '', body: '', recipientEmails: [] };
  }
  try {
    const result = await generateEmailFromClientCode({ clientCode: clientCode.toUpperCase() });
    return result;
  } catch (error) {
    console.error('Error in getEmailData action:', error);
    // On error, return an empty structure so the frontend doesn't break
    return { subject: '', body: '', recipientEmails: [] };
  }
}
