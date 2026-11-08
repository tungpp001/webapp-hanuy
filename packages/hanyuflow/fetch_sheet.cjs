const https = require('https');
const fs = require('fs');

const url = 'https://docs.google.com/spreadsheets/d/1jsqwOmfLFXU7JyrYJ7IkznHE5smgF-G7JN4Vze8uha8/export?format=csv&gid=0';

https.get(url, (res) => {
  // Handle redirects if any
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, handleResponse);
  } else {
    handleResponse(res);
  }
});

function handleResponse(res) {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
    fs.writeFileSync('src/data/raw_sheet.csv', text, 'utf8');
    console.log('Saved raw_sheet.csv, total characters:', text.length);
    
    // Parse CSV lines
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    console.log('Total rows:', lines.length);
    console.log('Sample row 0:', lines[0]);
    console.log('Sample row 1:', lines[1]);
    console.log('Sample row 2:', lines[2]);
  });
}
