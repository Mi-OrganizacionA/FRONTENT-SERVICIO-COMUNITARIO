const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let injected = 0;

for (const file of files) {
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (content.includes('sicag-db.js') && !content.includes('sicag-conflict.js')) {
    content = content.replace(
      '<script src="js/services/sicag-db.js"></script>',
      '<script src="js/services/sicag-db.js"></script>\n  <script src="js/services/sicag-conflict.js"></script>'
    );
    fs.writeFileSync(filepath, content, 'utf8');
    injected++;
  }
}

console.log(`Injected in ${injected} HTML files.`);
