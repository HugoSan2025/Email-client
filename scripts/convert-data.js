const fs = require('fs');
const path = require('path');

try {
  const dataPath = path.join(process.cwd(), 'src', 'temp-data.txt');
  const outputDir = path.join(process.cwd(), 'public', 'client-data');
  const batchSize = 500; // Split into files of 500 clients each

  if (!fs.existsSync(dataPath)) {
    console.error('Error: src/temp-data.txt not found. Please create it and paste your data.');
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  } else {
    // Clean up old files
    fs.readdirSync(outputDir).forEach(file => {
      if (file.startsWith('part-')) {
        fs.unlinkSync(path.join(outputDir, file));
      }
    });
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
        clients.push({
          code: String(code).trim(),
          name: name.trim(),
          emails: validEmails
        });
      }
    }
  }

  let fileCounter = 1;
  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize);
    const outputPath = path.join(outputDir, `part-${fileCounter}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(batch, null, 2));
    fileCounter++;
  }

  console.log(`Conversion complete! ${fileCounter - 1} data file(s) have been generated in public/client-data.`);

} catch (error) {
  console.error('An unexpected error occurred during conversion:', error);
  process.exit(1);
}
