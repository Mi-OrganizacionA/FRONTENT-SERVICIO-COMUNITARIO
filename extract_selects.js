const fs = require('fs');

const html = fs.readFileSync('censo_viviendas.html', 'utf8');
const selectRegex = /<select\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi;
const optionRegex = /<option\s+value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi;

const selects = {};
let match;
while ((match = selectRegex.exec(html)) !== null) {
  const id = match[1];
  const optionsHtml = match[2];
  const options = [];
  let optMatch;
  while ((optMatch = optionRegex.exec(optionsHtml)) !== null) {
    options.push({ value: optMatch[1], text: optMatch[2].trim() });
  }
  selects[id] = options;
}

console.log(JSON.stringify(selects, null, 2));
