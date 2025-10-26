
'use server';

import fs from 'fs/promises';
import path from 'path';
import { enhanceEmailDraft, EnhanceEmailDraftOutput } from '@/ai/flows/enhance-email-drafting-with-ai-suggestions';
import { GenerateEmailOutput } from '@/ai/flows/generate-email-from-client-code';

interface Client {
  code: string | number;
  name: string;
  emails: string[];
}

interface ClientData {
  clients: Client[];
}

async function findClient(clientCode: string): Promise<Client | undefined> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'client-data.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const data: ClientData = JSON.parse(jsonData);
  
  const client = data.clients.find(
    c => c.code.toString().trim() === clientCode.toString().trim()
  );
  return client;
}

export async function getEmailData(clientCode: string): Promise<GenerateEmailOutput> {
  if (!clientCode.trim()) {
    return { subject: '', body: '', recipientEmails: [] };
  }
  try {
    const client = await findClient(clientCode);
    
    if (!client) {
      return { recipientEmails: [], subject: '', body: '' };
    }

    // This can be replaced by a Genkit call if subject/body generation is needed
    const subject = `Comunicación con ${client.name}`;
    const body = `Estimado equipo de ${client.name},\n\nNos ponemos en contacto con ustedes para...`;

    return {
      recipientEmails: client.emails,
      subject: subject,
      body: body,
    };
  } catch (error) {
    console.error('Error in getEmailData action:', error);
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
    return { suggestedImprovements: emailBody };
  }
}
