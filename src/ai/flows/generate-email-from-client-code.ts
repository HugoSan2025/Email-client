// This file is no longer used for client search but is kept for its type definitions.
// The search logic has been moved to src/app/actions.ts for reliability.
'use server';

import { z } from 'genkit';

export const GenerateEmailInputSchema = z.object({
  clientCode: z.string().describe('The code of the client.'),
});
export type GenerateEmailInput = z.infer<typeof GenerateEmailInputSchema>;

export const GenerateEmailOutputSchema = z.object({
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The body of the email.'),
  recipientEmails: z
    .array(z.string())
    .describe('The recipient emails based on the client code.'),
});
export type GenerateEmailOutput = z.infer<typeof GenerateEmailOutputSchema>;
