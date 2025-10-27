const fs = require('fs');
const path = require('path');

try {
  const dataPath = path.join(process.cwd(), 'src', 'temp-data.txt');
  const outputPath = path.join(process.cwd(), 'src', 'lib', 'client-data.ts');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Error: src/temp-data.txt not found. Please create it and paste your data.');
    process.exit(1);
  }

  const data = fs.readFileSync(dataPath, 'utf8');
  const lines = data.split(/\r?\n/);
  const clients = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split('\t');
    const [code, name, ...emails] = parts;

    if (code && name) {
      const validEmails = emails.map(e => e.trim()).filter(e => e && e.includes('@'));
      if (validEmails.length > 0) {
        // Using JSON.stringify on the name handles all special characters (quotes, backslashes, etc.) safely.
        clients.push({
          code: String(code).trim(),
          name: name.trim(), // The name will be stringified later as a whole object
          emails: validEmails
        });
      }
    }
  }

  // Using JSON.stringify with a replacer on the whole array is the safest way to build the final string.
  const tsContent = 'export const clients = ' + JSON.stringify(clients, null, 2) + ';\n';
  
  fs.writeFileSync(outputPath, tsContent);
  console.log('Conversion complete! src/lib/client-data.ts has been generated successfully.');

} catch (error) {
  console.error('An unexpected error occurred during conversion:', error);
  process.exit(1);
}
