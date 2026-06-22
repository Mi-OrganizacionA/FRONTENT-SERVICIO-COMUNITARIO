const excel = require('exceljs');
const PDFDocument = require('pdfkit-table');

class ExportGeneratorService {
  /**
   * Genera un Buffer con el archivo Excel
   * @param {Array} headers - Array de strings con los nombres de las columnas
   * @param {Array} data - Array de objetos con los datos de las filas
   * @param {String} sheetName - Nombre de la hoja
   * @param {String} sheetName - Nombre de la hoja
   * @param {String} filtrosText - Texto con los filtros aplicados
   * @returns {Promise<Buffer>}
   */
  static async generateExcel(headers, data, sheetName = 'Reporte', filtrosText = '') {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Definir columnas
    worksheet.columns = headers.map(h => ({
      header: h,
      key: h.toLowerCase().replace(/ /g, '_'),
      width: Math.max(h.length + 5, 15)
    }));

    // Estilos de cabecera
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E7D32' } // Verde SICAG
    };

    if (filtrosText) {
      worksheet.insertRow(1, [filtrosText]);
      worksheet.getRow(1).font = { italic: true };
      worksheet.mergeCells(`A1:${String.fromCharCode(65 + headers.length - 1)}1`);
    }

    // Agregar filas
    data.forEach(item => {
      const row = worksheet.addRow(item);
      if (item[0] && item[0].toString().startsWith('  ↳')) {
        row.font = { italic: true, color: { argb: 'FF666666' }, size: 9 };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Genera un Buffer con el archivo PDF en formato tabla
   * @param {String} title - Título del reporte
   * @param {Array} headers - Array de strings con los nombres de las columnas
   * @param {Array} data - Array de arrays con los valores de las filas
   * @param {Array} data - Array de arrays con los valores de las filas
   * @param {String} filtrosText - Texto descriptivo de los filtros
   * @returns {Promise<Buffer>}
   */
  static generatePDF(title, headers, data, filtrosText = '') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Agregar el Logo
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(__dirname, '../../assets/img/logo_comuna_fondoremovido.png');
        
        if (fs.existsSync(logoPath)) {
          // Posicionar arriba a la izquierda
          doc.image(logoPath, 40, 25, { width: 50 });
        }

        // Encabezado
        doc.moveDown(0.5);
        doc.fontSize(20).fillColor('#2E7D32').text('SICAG', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).fillColor('#333333').text(title, { align: 'center' });
        
        if (filtrosText) {
          doc.moveDown(0.3);
          doc.fontSize(10).fillColor('#666666').text(filtrosText, { align: 'center' });
        }
        
        doc.moveDown(2);

        // Tabla
        const table = {
          headers: headers,
          rows: data
        };

        doc.table(table, {
          prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000'),
          prepareRow: (row, i) => {
            if (row[0] && row[0].toString().startsWith('  ↳')) {
              doc.font('Helvetica-Oblique').fontSize(8).fillColor('#666666');
            } else {
              doc.font('Helvetica').fontSize(9).fillColor('#333333');
            }
          }
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Genera un string HTML con una tabla estilizada para visualizar en el navegador
   * @param {Array} headers - Nombres de columnas
   * @param {Array} data - Filas de datos
   * @param {String} title - Título del reporte
   * @param {String} filtrosText - Texto descriptivo de los filtros
   * @returns {String} HTML completo
   */
  static generateExcelHTML(headers, data, title = 'Reporte', filtrosText = '') {
    const thead = headers.map(h => `<th>${h}</th>`).join('');
    const tbody = data.map(row => {
      const tds = row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ''}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${title} - Vista Previa SICAG</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; padding: 20px; color: #333; }
          .container { max-width: 100%; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow-x: auto; }
          .header-box { margin-bottom: 20px; border-bottom: 2px solid #2E7D32; padding-bottom: 10px; }
          h1 { color: #2E7D32; margin: 0 0 5px 0; font-size: 24px; }
          p.filtros { color: #666; font-size: 14px; margin: 0; font-style: italic; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th, td { padding: 12px 15px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #2E7D32; color: white; position: sticky; top: 0; z-index: 10; font-weight: 500; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:hover { background-color: #f1f8e9; }
          .btn-print { margin-bottom: 20px; padding: 10px 20px; background: #1565C0; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
          .btn-print:hover { background: #0D47A1; }
          @media print { .btn-print { display: none; } body { padding: 0; background: white; } .container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
          <div class="header-box">
            <h1>${title}</h1>
            ${filtrosText ? `<p class="filtros">${filtrosText}</p>` : ''}
          </div>
          <table>
            <thead><tr>${thead}</tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  static generateChartPDF(title, base64Image, filtrosText = '') {
    return new Promise((resolve, reject) => {
      try {
        // Landscape or portrait? For a single chart, landscape is usually better.
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Agregar el Logo
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(__dirname, '../../assets/img/logo_comuna_fondoremovido.png');
        
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 40, 25, { width: 50 });
        }

        // Encabezado
        doc.moveDown(0.5);
        doc.fontSize(20).fillColor('#2E7D32').text('SICAG', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).fillColor('#333333').text(title, { align: 'center' });
        
        if (filtrosText) {
          doc.moveDown(0.3);
          doc.fontSize(10).fillColor('#666666').text(filtrosText, { align: 'center' });
        }
        
        doc.moveDown(2);

        // Renderizar la imagen Base64
        if (base64Image) {
          try {
            // El formato Base64 suele ser 'data:image/png;base64,iVBORw0KGgo...'
            const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
            const imgBuffer = Buffer.from(base64Data, 'base64');
            
            // La centramos y ajustamos al ancho de la hoja si es muy grande
            doc.image(imgBuffer, {
              fit: [doc.page.width - 60, doc.page.height - 200],
              align: 'center',
              valign: 'center'
            });
          } catch (e) {
            doc.fontSize(12).fillColor('red').text('Error al procesar la imagen de la gráfica.', { align: 'center' });
          }
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ExportGeneratorService;
