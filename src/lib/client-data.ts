
import { clients } from './client-data-array';

interface Client {
  code: string;
  name: string;
  emails: string[];
}

let allClients: Client[] = [];
let clientsLoaded = false;

// This function now synchronously returns the imported client data.
// It ensures the data is structured correctly on the first call.
export function getClients(): Client[] {
  if (clientsLoaded) {
    return allClients;
  }

  // The 'clients' import is already an array of objects.
  // We can do any one-time processing here if needed.
  allClients = clients.map(client => ({
    code: String(client.code).trim(),
    name: client.name.trim(),
    emails: client.emails.map(email => email.trim()).filter(email => email),
  }));
  
  clientsLoaded = true;
  console.log(`Loaded ${allClients.length} clients synchronously.`);
  return allClients;
}

    