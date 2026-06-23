const fs = require('fs');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let c = fs.readFileSync(filePath, 'utf8');
    c = c.replace(/Ã¡/g, 'á')
         .replace(/Ã©/g, 'é')
         .replace(/Ã­/g, 'í')
         .replace(/Ã³/g, 'ó')
         .replace(/Ãº/g, 'ú')
         .replace(/Ã±/g, 'ñ')
         .replace(/Ã /g, 'Á')
         .replace(/Ã‰/g, 'É')
         .replace(/Ã /g, 'Í')
         .replace(/Ã“/g, 'Ó')
         .replace(/Ãš/g, 'Ú')
         .replace(/Ã‘/g, 'Ñ');
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Fixed', filePath);
}

fixFile('c:/FRONTENT-SERVICIO-COMUNITARIO/js/notificaciones.js');
fixFile('c:/FRONTENT-SERVICIO-COMUNITARIO/js/api.js');
