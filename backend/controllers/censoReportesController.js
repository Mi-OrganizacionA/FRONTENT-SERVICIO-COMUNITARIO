const logger = require('../utils/logger');
const models = require('../models');
const CensoReportesService = require('../services/censoReportesService');
const ExportGeneratorService = require('../services/exportGeneratorService');

class CensoReportesController {
  
  static setModels(models) {
    this.dbModels = models;
  }
  
  static injectModels(models) {
    CensoReportesController.dbModels = models;
  }

  /**
   * Obtiene la fecha mínima de registro (para prellenar calendarios front)
   */
  static async getFechaMinima(req, res) {
    try {
      if (!CensoReportesController.dbModels) throw new Error('DB Models no inyectados');
      const minDate = await CensoReportesService.getFechaMinima(CensoReportesController.dbModels);
      res.json({ fecha_minima: minDate });
    } catch (error) {
      console.error('Error getFechaMinima:', error);
      res.status(500).json({ error: 'Error obteniendo fecha mínima' });
    }
  }

  /**
   * Obtiene los KPIs estadísticos del censo para la vista principal de reportes
   */
  static async getKpis(req, res) {
    try {
      const filtros = {
        consejo_id: req.query.consejo_id,
        fecha_desde: req.query.desde,
        fecha_hasta: req.query.hasta,
        edad_min: req.query.edad_min,
        edad_max: req.query.edad_max,
        genero: req.query.genero,
        salud: req.query.salud,
        cne: req.query.cne,
        trabajo: req.query.trabajo
      };

      if (req.user && req.user.rol === 'vocero') {
        filtros.consejo_id = req.user.consejo_comunal_id || req.user.id_comunidad_asignada;
      }

      if (!CensoReportesController.dbModels) throw new Error('Modelos de base de datos no inyectados en CensoReportesController');
      const kpis = await CensoReportesService.getKpis(CensoReportesController.dbModels, filtros);
      
      res.json(kpis);
    } catch (error) {
      logger.error('Error obteniendo KPIs de reportes:', error);
      res.status(500).json({ error: 'Error obteniendo KPIs estadísticos' });
    }
  }

  /**
   * Obtiene el resumen detallado agrupado por Consejo Comunal
   */
  static async getResumen(req, res) {
    try {
      if (!CensoReportesController.dbModels) throw new Error('Modelos no inyectados');
      const { desde, hasta, edad_min, edad_max, genero, salud, cne, trabajo } = req.query;
      let consejo_id = req.query.consejo_id;
      if (req.user && req.user.rol === 'vocero') {
        consejo_id = req.user.consejo_comunal_id || req.user.id_comunidad_asignada;
      }
      const resumen = await CensoReportesService.getResumenPorConsejo(CensoReportesController.dbModels, {
        desde, hasta, consejo_id, edad_min, edad_max, genero, salud, cne, trabajo
      });
      res.json(resumen);
    } catch (error) {
      logger.error('Error obteniendo resumen por consejo:', error);
      res.status(500).json({ error: 'Error obteniendo resumen estadístico' });
    }
  }

  /**
   * Exporta un reporte en formato PDF o Excel
   */
  static async exportarReporte(req, res) {
    try {
      const { tipo, format, desde, hasta, edad_min, edad_max, genero, salud, cne, trabajo, nac_min, nac_max, extras } = req.query;
      let consejo_id = req.query.consejo_id;

      if (!tipo || !format) {
        return res.status(400).json({ error: 'Parámetros "tipo" y "format" son requeridos.' });
      }

      if (req.user && req.user.rol === 'vocero') {
        consejo_id = req.user.consejo_comunal_id || req.user.id_comunidad_asignada;
      }

      const filtros = { desde, hasta, consejo_id, edad_min, edad_max, genero, salud, cne, trabajo, nac_min, nac_max, extras };
      
      if (!CensoReportesController.dbModels) throw new Error('Modelos de base de datos no inyectados en CensoReportesController');

      // Construir texto de filtros para el documento
      let filtrosText = '';
      const filtrosArr = [];
      if (desde) filtrosArr.push(`Desde: ${desde}`);
      if (hasta) filtrosArr.push(`Hasta: ${hasta}`);
      if (consejo_id) {
        const consejo = await CensoReportesController.dbModels.ConsejoComunal.findByPk(consejo_id);
        if (consejo) filtrosArr.push(`Consejo Comunal: ${consejo.nombre_comunidad}`);
      }
      if (edad_min || edad_max) filtrosArr.push(`Edad: ${edad_min||'0'} a ${edad_max||'∞'} años`);
      if (nac_min || nac_max) filtrosArr.push(`F. Nacimiento: ${nac_min||'Cualquiera'} a ${nac_max||'Cualquiera'}`);
      if (genero) filtrosArr.push(`Género: ${genero}`);
      if (salud) filtrosArr.push(`Salud: ${salud}`);
      if (cne) filtrosArr.push(`CNE: ${cne === '1' ? 'Inscrito' : 'No Inscrito'}`);
      if (trabajo) filtrosArr.push(`Trabaja: ${trabajo === '1' ? 'Sí' : 'No'}`);
      
      if (filtrosArr.length > 0) filtrosText = 'Filtros aplicados - ' + filtrosArr.join(' | ');

      // Obtener datos estructurados del servicio
      const { title, headers, rows } = await CensoReportesService.getReporteData(CensoReportesController.dbModels, tipo, filtros);

      const action = req.query.action || 'download';
      const isView = action === 'view';

      // Generar archivo según formato
      if (format.toLowerCase() === 'pdf') {
        const pdfBuffer = await ExportGeneratorService.generatePDF(title, headers, rows, filtrosText);
        
        const disposition = isView ? 'inline' : 'attachment';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename=reporte_${tipo}_${Date.now()}.pdf`);
        return res.send(pdfBuffer);
      } 
      else if (format.toLowerCase() === 'excel') {
        if (isView) {
          // El usuario solicitó VER el reporte Excel en el navegador
          // Retornaremos una tabla HTML renderizada
          const htmlContent = ExportGeneratorService.generateExcelHTML(headers, rows, title, filtrosText);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.send(htmlContent);
        } else {
          // El usuario solicitó DESCARGAR el Excel (.xlsx)
          const excelBuffer = await ExportGeneratorService.generateExcel(headers, rows, title, filtrosText);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename=reporte_${tipo}_${Date.now()}.xlsx`);
          return res.send(excelBuffer);
        }
      } 
      else {
        return res.status(400).json({ error: 'Formato no soportado. Use "pdf" o "excel".' });
      }

    } catch (error) {
      logger.error('Error exportando reporte:', error);
      res.status(500).json({ error: 'Error generando el archivo de exportación: ' + error.message });
    }
  }

  /**
   * Exporta una gráfica individual en formato PDF
   */
  static async exportarGraficaPdf(req, res) {
    try {
      const { titulo, imagenBase64, filtros } = req.body;
      let consejo_id = filtros?.consejo_id;

      if (!titulo || !imagenBase64) {
        return res.status(400).json({ error: 'Falta el título o la imagen base64 de la gráfica.' });
      }

      if (req.user && req.user.rol === 'vocero') {
        consejo_id = req.user.consejo_comunal_id || req.user.id_comunidad_asignada;
      }

      if (!CensoReportesController.dbModels) throw new Error('Modelos de base de datos no inyectados en CensoReportesController');

      let filtrosText = '';
      const filtrosArr = [];
      if (consejo_id) {
        const consejo = await CensoReportesController.dbModels.ConsejoComunal.findByPk(consejo_id);
        if (consejo) filtrosArr.push(`Consejo Comunal: ${consejo.nombre_comunidad}`);
      } else {
        filtrosArr.push('Toda la Comuna');
      }
      if (filtrosArr.length > 0) filtrosText = 'Filtros aplicados - ' + filtrosArr.join(' | ');

      const pdfBuffer = await ExportGeneratorService.generateChartPDF(titulo, imagenBase64, filtrosText);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=grafica_${Date.now()}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error exportando gráfica a PDF:', error);
      res.status(500).json({ error: 'Error generando el archivo PDF de la gráfica.' });
    }
  }
}

module.exports = CensoReportesController;
