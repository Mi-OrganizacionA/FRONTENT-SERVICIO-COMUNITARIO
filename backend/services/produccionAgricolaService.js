const logger = require('../utils/logger');

class ProduccionAgricolaService {
  
  /**
   * Crear nuevo registro de producción agrícola
   */
  static async crear(ProduccionAgricolaModel, data) {
    try {
      const produccion = await ProduccionAgricolaModel.create(data);
      return produccion;
    } catch (error) {
      logger.error('Error creating producción agrícola:', error);
      throw error;
    }
  }

  /**
   * Obtener producciones de un habitante
   */
  static async getPorHabitante(ProduccionAgricolaModel, habitanteId) {
    try {
      const producciones = await ProduccionAgricolaModel.findAll({
        where: { id_habitante: habitanteId, activo: true },
        order: [['fecha_creacion', 'DESC']]
      });
      return producciones;
    } catch (error) {
      logger.error('Error fetching producciones:', error);
      throw error;
    }
  }

  /**
   * Obtener producciones por tipo de cultivo
   */
  static async getPorTipoCultivo(ProduccionAgricolaModel, tipoCultivo) {
    try {
      const producciones = await ProduccionAgricolaModel.findAll({
        where: { tipo_cultivo: tipoCultivo, activo: true },
        order: [['fecha_creacion', 'DESC']]
      });
      return producciones;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de producción por consejo
   */
  static async getEstadisticasPorConsejo(ProduccionAgricolaModel, HabitanteModel, consejoId) {
    try {
      // Obtener todos los habitantes del consejo
      const habitantes = await HabitanteModel.findAll({
        where: { id_comunidad: consejoId }
      });

      const habitanteIds = habitantes.map(h => h.id);

      // Obtener producciones activas
      const producciones = await ProduccionAgricolaModel.findAll({
        where: { 
          id_habitante: habitanteIds,
          activo: true
        }
      });

      // Calcular estadísticas
      const totalProductores = new Set(producciones.map(p => p.id_habitante)).size;
      const totalHectareas = producciones.reduce((sum, p) => sum + (p.hectareas_cultivadas || 0), 0);
      
      const cultivosPorTipo = {};
      producciones.forEach(p => {
        cultivosPorTipo[p.tipo_cultivo] = (cultivosPorTipo[p.tipo_cultivo] || 0) + 1;
      });

      return {
        consejoId,
        totalProductores,
        totalHectareas: totalHectareas.toFixed(2),
        totalProducciones: producciones.length,
        cultivosPorTipo,
        producciones
      };
    } catch (error) {
      logger.error('Error calculating estadísticas:', error);
      throw error;
    }
  }

  /**
   * Detectar si un habitante es "productor"
   * Un productor es quien tiene al menos 1 producción activa
   */
  static async esProductor(ProduccionAgricolaModel, habitanteId) {
    try {
      const count = await ProduccionAgricolaModel.count({
        where: { id_habitante: habitanteId, activo: true }
      });
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Actualizar producción
   */
  static async actualizar(ProduccionAgricolaModel, id, data) {
    try {
      const produccion = await ProduccionAgricolaModel.findByPk(id);
      if (!produccion) return null;

      await produccion.update(data);
      return produccion;
    } catch (error) {
      logger.error('Error updating producción:', error);
      throw error;
    }
  }

  /**
   * Eliminar producción (soft delete)
   */
  static async eliminar(ProduccionAgricolaModel, id) {
    try {
      const produccion = await ProduccionAgricolaModel.findByPk(id);
      if (!produccion) return null;

      await produccion.update({ activo: false });
      return produccion;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener resumen de producción para un habitante
   */
  static async getResumenPorHabitante(ProduccionAgricolaModel, habitanteId) {
    try {
      const producciones = await this.getPorHabitante(ProduccionAgricolaModel, habitanteId);
      
      if (producciones.length === 0) {
        return {
          esProductor: false,
          totalProducciones: 0,
          totalHectareas: 0,
          rubros: [],
          cultivos: []
        };
      }

      const rubros = [...new Set(producciones.map(p => p.rubro))];
      const cultivos = [...new Set(producciones.map(p => p.tipo_cultivo))];
      const totalHectareas = producciones.reduce((sum, p) => sum + (p.hectareas_cultivadas || 0), 0);

      return {
        esProductor: true,
        totalProducciones: producciones.length,
        totalHectareas: totalHectareas.toFixed(2),
        rubros,
        cultivos,
        producciones
      };
    } catch (error) {
      logger.error('Error getting resumen:', error);
      throw error;
    }
  }
}

module.exports = ProduccionAgricolaService;
