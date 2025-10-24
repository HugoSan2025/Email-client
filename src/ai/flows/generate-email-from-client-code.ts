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
  // Convert both the client code from the data and the input to strings for reliable comparison.
  const client = clientData.clients.find(c => String(c.code) === String(input.clientCode));
  return client ? client.emails : [];
});

const prompt = ai.definePrompt({
  name: 'generateEmailPrompt',
  input: {schema: z.object({
    clientCode: z.string(),
    recipientEmails: z.array(z.string()),
  })},
  output: {schema: GenerateEmailOutputSchema},
  tools: [getClientEmails],
  prompt: `You are an AI email assistant. Generate a draft email subject and body in Spanish based on the client code.

  The recipient emails have been provided. You MUST include them in the 'recipientEmails' output field.

  Generate an appropriate subject and body for an email to the client, assuming common communication patterns. The entire response must be in Spanish.

  Client Code: {{{clientCode}}}
  Recipient Emails: {{{JSONstringify recipientEmails}}}
`,
});

const generateEmailFlow = ai.defineFlow(
  {
    name: 'generateEmailFlow',
    inputSchema: GenerateEmailInputSchema,
    outputSchema: GenerateEmailOutputSchema,
  },
  async input => {
    const clientEmails = await getClientEmails(input);
    const {output} = await prompt({
        clientCode: input.clientCode,
        recipientEmails: clientEmails,
    });
    // Ensure the emails from the tool are what's returned.
    output!.recipientEmails = clientEmails;
    return output!;
  }
);
