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
      worksheet.addRow(item);
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
          prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
          prepareRow: (row, i) => doc.font('Helvetica').fontSize(9)
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ExportGeneratorService;
