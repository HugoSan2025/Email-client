
import { clients } from './client-data-array';

interface Client {
  code: string;
  name: string;
  emails: string[];
}

// The client data is now imported synchronously from the auto-generated file.
export function getClients(): Client[] {
  return clients;
}
