const fs = require('fs');
let content = fs.readFileSync('censo_viviendas.html', 'utf8');

const map = {
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã±': 'ñ',
  'Ã ': 'Á',
  'Ã‰': 'É',
  'Ã ': 'Í',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã‘': 'Ñ',
  'Â¿': '¿',
  'Â¡': '¡',
  'â€”': '—',
  'Â·': '·',
  'â• ': '═',
  'Â°': '°',
  'Ã¼': 'ü',
  'Ãœ': 'Ü'
};

for (const [bad, good] of Object.entries(map)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync('censo_viviendas.html', content, 'utf8');
console.log('Fixed encoding in censo_viviendas.html');
