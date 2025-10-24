'use server';

/**
 * @fileOverview Generates a draft email based on a client code using common communication patterns.
 *
 * - generateEmailFromClientCode - A function that generates an email draft based on the client code.
 * - GenerateEmailInput - The input type for the generateEmailFromClientCode function.
 * - GenerateEmailOutput - The return type for the generateEmailFromClientCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import clientData from '@/lib/client-data.json';

const GenerateEmailInputSchema = z.object({
  clientCode: z.string().describe('The code of the client.'),
});
export type GenerateEmailInput = z.infer<typeof GenerateEmailInputSchema>;

const GenerateEmailOutputSchema = z.object({
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The body of the email.'),
  recipientEmails: z.array(z.string()).describe('The recipient emails based on the client code.'),
});
export type GenerateEmailOutput = z.infer<typeof GenerateEmailOutputSchema>;

export async function generateEmailFromClientCode(input: GenerateEmailInput): Promise<GenerateEmailOutput> {
  return generateEmailFlow(input);
}

const getClientEmails = ai.defineTool({
  name: 'getClientEmails',
  description: 'Retrieves a list of email addresses associated with a given client code.',
  inputSchema: z.object({
    clientCode: z.string().describe('The code of the client to retrieve emails for.'),
  }),
  outputSchema: z.array(z.string()).describe('An array of email addresses associated with the client code.'),
}, async (input) => {
  // The code can be a string or a number, so we compare it loosely.
  const client = clientData.clients.find(c => c.code == input.clientCode);
  return client ? client.emails : [];
});

const prompt = ai.definePrompt({
  name: 'generateEmailPrompt',
  input: {schema: GenerateEmailInputSchema},
  output: {schema: GenerateEmailOutputSchema},
  tools: [getClientEmails],
  prompt: `You are an AI email assistant. Generate a draft email subject and body based on the client code.

  First, use the getClientEmails tool to retrieve the recipient emails for the given client code.

  Then, generate an appropriate subject and body for an email to the client, assuming common communication patterns.

  Client Code: {{{clientCode}}}
`,
});

const generateEmailFlow = ai.defineFlow(
  {
    name: 'generateEmailFlow',
    inputSchema: GenerateEmailInputSchema,
    outputSchema: GenerateEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
