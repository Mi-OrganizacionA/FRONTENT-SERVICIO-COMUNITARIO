const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const faviconTags = `
  <link rel="icon" type="image/png" href="assets/img/logo_comuna_fondoremovido.png">
  <link rel="apple-touch-icon" href="assets/img/logo_comuna_fondoremovido.png">
`;

let changedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already has favicon
  if (!content.includes('rel="icon"')) {
    // Insert before </head>
    if (content.includes('</head>')) {
      content = content.replace('</head>', `${faviconTags}</head>`);
      fs.writeFileSync(filePath, content, 'utf8');
      changedCount++;
      console.log(`Updated ${file}`);
    }
  } else {
    // If it has rel="icon" but not the correct one, we might want to replace it, but maybe it's already correct.
    // Let's check if it has the specific href
    if (!content.includes('logo_comuna_fondoremovido.png')) {
      console.log(`File ${file} has a different icon.`);
    }
  }
}

console.log(`Total files updated: ${changedCount}`);
