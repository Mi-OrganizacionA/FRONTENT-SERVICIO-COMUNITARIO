const fs = require('fs');
let c = fs.readFileSync('censo_viviendas.html', 'utf8');

c = c.replace(
  /return `\<span class="cv-badge \$\{map\[c\] \|\| 'regular'\}">\s*<i class="fas \$\{icons\[c\] \|\| 'fa-circle-minus'\}"><\/i>\$\{c \|\| '-'\}.*/g,
  "return `<span class=\"cv-badge ${map[key]}\"><i class=\"fas ${icons[key]}\"></i>${c || '-'}</span>`;"
);

fs.writeFileSync('censo_viviendas.html', c);
console.log('Done');
