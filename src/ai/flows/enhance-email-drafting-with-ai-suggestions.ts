// src/ai/flows/enhance-email-drafting-with-ai-suggestions.ts
'use server';
/**
 * @fileOverview Provides AI-powered suggestions for improving email drafts, including wording, grammar, and tone.
 *
 * - enhanceEmailDraft - A function that takes an email draft and returns AI-powered suggestions for improvement.
 * - EnhanceEmailDraftInput - The input type for the enhanceEmailDraft function.
 * - EnhanceEmailDraftOutput - The return type for the enhanceEmailDraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceEmailDraftInputSchema = z.object({
  emailDraft: z
    .string()
    .describe('The current draft of the email that needs improvement.'),
});
export type EnhanceEmailDraftInput = z.infer<typeof EnhanceEmailDraftInputSchema>;

const EnhanceEmailDraftOutputSchema = z.object({
  suggestedImprovements: z
    .string()
    .describe(
      'AI-powered suggestions for improving the email draft, including alternative wording, grammar corrections, and tone adjustments.'
    ),
});
export type EnhanceEmailDraftOutput = z.infer<typeof EnhanceEmailDraftOutputSchema>;

export async function enhanceEmailDraft(input: EnhanceEmailDraftInput): Promise<EnhanceEmailDraftOutput> {
  return enhanceEmailDraftFlow(input);
}

const enhanceEmailDraftPrompt = ai.definePrompt({
  name: 'enhanceEmailDraftPrompt',
  input: {schema: EnhanceEmailDraftInputSchema},
  output: {schema: EnhanceEmailDraftOutputSchema},
  prompt: `You are an AI assistant specialized in improving email drafts.

You will receive an email draft and provide suggestions for improvement, including alternative wording, grammar corrections, and adjusting the tone to be more professional.

Email Draft: {{{emailDraft}}}

Suggestions:`, // Added prompt for instructions and context
});

const enhanceEmailDraftFlow = ai.defineFlow(
  {
    name: 'enhanceEmailDraftFlow',
    inputSchema: EnhanceEmailDraftInputSchema,
    outputSchema: EnhanceEmailDraftOutputSchema,
  },
  async input => {
    const {output} = await enhanceEmailDraftPrompt(input);
    return output!;
  }
);
