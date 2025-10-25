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

// Lee los datos del cliente desde el archivo JSON de forma síncrona.
// Esto es más robusto para el entorno de servidor de Next.js en producción.
const clientDataPath = path.join(process.cwd(), 'src', 'lib', 'client-data.json');
const clientData = JSON.parse(fs.readFileSync(clientDataPath, 'utf-8'));


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

export async function generateEmailFromClientCode(
  input: GenerateEmailInput
): Promise<GenerateEmailOutput> {
  return generateEmailFlow(input);
}

const getClientEmails = ai.defineTool(
  {
    name: 'getClientEmails',
    description:
      'Retrieves a list of email addresses associated with a given client code.',
    inputSchema: z.object({
      clientCode: z
        .string()
        .describe('The code of the client to retrieve emails for.'),
    }),
    outputSchema: z
      .array(z.string())
      .describe('An array of email addresses associated with the client code.'),
  },
  async input => {
    // Convert both the client code from the data and the input to strings for reliable comparison.
    const client = clientData.clients.find(
      c => String(c.code) === String(input.clientCode)
    );
    return client ? client.emails : [];
  }
);

const prompt = ai.definePrompt({
  name: 'generateEmailPrompt',
  tools: [getClientEmails],
  system: `You are an AI email assistant. Your task is to generate a draft email subject and body in Spanish based on a client code.
You MUST use the getClientEmails tool to get the emails for the provided client code and include the found emails in the recipientEmails field of your final response.
Then, generate an appropriate subject and body for an email to that client, assuming common communication patterns.
The entire response, including subject and body, must be in Spanish.
`,
  input: {
    schema: GenerateEmailInputSchema,
  },
  output: {
    schema: GenerateEmailOutputSchema,
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
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        // If the AI fails for any reason, try to find emails manually and return a blank body/subject
        console.error("AI output was null. Falling back to manual email retrieval.");
        const emails = await getClientEmails(input);
        return {
            subject: '',
            body: '',
            recipientEmails: emails
        };
    }
    return output;
  }
);
