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
import clientData from '@/lib/client-data.json'; // Import the JSON data directly

interface Client {
  code: string;
  name: string;
  emails: string[];
}

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

// This function now finds the entire client object.
async function findClient(clientCode: string): Promise<Client | undefined> {
  try {
    const client = clientData.clients.find(
      (c: Client) => String(c.code) === String(clientCode)
    );
    return client;
  } catch (error) {
    console.error(`Error finding client for code ${clientCode}.`, error);
    return undefined;
  }
}

export async function generateEmailFromClientCode(
  input: GenerateEmailInput
): Promise<GenerateEmailOutput> {
  return generateEmailFlow(input);
}


// The prompt now receives clientName instead of clientCode.
const prompt = ai.definePrompt({
  name: 'generateEmailTextPrompt',
  system: `You are an AI email assistant. Your task is to generate a draft email subject and body in Spanish based on a client's name.
Generate an appropriate subject and body for an email to that client, assuming common communication patterns.
The entire response, including subject and body, must be in Spanish.
`,
  input: {
    schema: z.object({ clientName: z.string() }),
  },
  output: {
    schema: z.object({
        subject: z.string().describe('The subject of the email.'),
        body: z.string().describe('The body of the email.'),
    }),
  },
  prompt: `Client Name: {{{clientName}}}
`,
});

const generateEmailFlow = ai.defineFlow(
  {
    name: 'generateEmailFlow',
    inputSchema: GenerateEmailInputSchema,
    outputSchema: GenerateEmailOutputSchema,
  },
  async (input) : Promise<GenerateEmailOutput> => {
    // Step 1: Reliably get the client object.
    const client = await findClient(input.clientCode);

    if (!client) {
      // If client is not found, return an empty structure.
      return {
        recipientEmails: [],
        subject: '',
        body: '',
      };
    }

    // Step 2: Ask the AI to generate text using the client's name.
    const { output: aiText } = await prompt({ clientName: client.name });

    // Step 3: Combine the results.
    // If AI fails, we still return the emails with empty text.
    return {
      recipientEmails: client.emails,
      subject: aiText?.subject || '',
      body: aiText?.body || '',
    };
  }
);

    