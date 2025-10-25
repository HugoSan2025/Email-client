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
import * as fs from 'fs';
import * as path from 'path';

const GenerateEmailInputSchema = z.object({
  clientCode: z.string().describe('The code of the client.'),
});
export type GenerateEmailInput = z.infer<typeof GenerateEmailInputSchema>;

const GenerateEmailOutputSchema = z.object({
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The body of the email.'),
  recipientEmails: z
    .array(z.string())
    .describe('The recipient emails based on the client code.'),
});
export type GenerateEmailOutput = z.infer<
  typeof GenerateEmailOutputSchema
>;

// This is the direct data-fetching function, moved out of the AI tool.
async function findClientEmails(clientCode: string): Promise<string[]> {
  try {
    const clientDataPath = path.join(process.cwd(), 'src', 'lib', 'client-data.json');
    const clientData = JSON.parse(fs.readFileSync(clientDataPath, 'utf-8'));
    const client = clientData.clients.find(
      (c: { code: any; }) => String(c.code) === String(clientCode)
    );
    return client ? client.emails : [];
  } catch (error) {
    console.error(`Failed to read or parse client-data.json for code ${clientCode}`, error);
    return [];
  }
}

export async function generateEmailFromClientCode(
  input: GenerateEmailInput
): Promise<GenerateEmailOutput> {
  return generateEmailFlow(input);
}


// The prompt no longer knows about emails. It only generates text.
const prompt = ai.definePrompt({
  name: 'generateEmailTextPrompt',
  system: `You are an AI email assistant. Your task is to generate a draft email subject and body in Spanish based on a client code.
Generate an appropriate subject and body for an email to that client, assuming common communication patterns.
The entire response, including subject and body, must be in Spanish.
`,
  input: {
    schema: z.object({ clientCode: z.string() }),
  },
  output: {
    schema: z.object({
        subject: z.string().describe('The subject of the email.'),
        body: z.string().describe('The body of the email.'),
    }),
  },
  prompt: `Client Code: {{{clientCode}}}
`,
});

const generateEmailFlow = ai.defineFlow(
  {
    name: 'generateEmailFlow',
    inputSchema: GenerateEmailInputSchema,
    outputSchema: GenerateEmailOutputSchema,
  },
  async (input) : Promise<GenerateEmailOutput> => {
    // Step 1: Reliably get the emails using simple code.
    const emails = await findClientEmails(input.clientCode);

    // Step 2: Ask the AI to generate only the text.
    const { output: aiText } = await prompt(input);

    // Step 3: Combine the results.
    // If AI fails, we still return the emails with empty text.
    return {
      recipientEmails: emails,
      subject: aiText?.subject || '',
      body: aiText?.body || '',
    };
  }
);
