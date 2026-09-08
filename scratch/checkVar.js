const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/AICheckupPage.jsx', 'utf8');
const lines = content.split('\n');
let count = 0;
lines.forEach((l, i) => {
  if (l.includes('currentAiQuestion')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
    count++;
  }
});
console.log(`Total occurrences: ${count}`);
