const logger = require('../utils/logger');

class HabitantesService {
  
  /**
   * Calcular edad basado en fecha de nacimiento
   */
  static calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  /**
   * Determinar si una persona es elector (mayor o igual a 15 años)
   */
  static esElector(fechaNacimiento) {
    const edad = this.calcularEdad(fechaNacimiento);
    return edad !== null && edad >= 15;
  }

  /**
   * Agregar campos calculados a un habitante
   */
  static enriquecerHabitante(habitante) {
    const habitanteData = habitante.toJSON ? habitante.toJSON() : habitante;
    
    const edad = this.calcularEdad(habitanteData.fecha_nacimiento);
    const elector = this.esElector(habitanteData.fecha_nacimiento);
    
    return {
      ...habitanteData,
      edad, // Calculado dinámicamente
      elector // Calculado dinámicamente
    };
  }

  /**
   * Crear o Reactivar habitante
   */
  static async crear(habitanteModel, data) {
    try {
      if (data.fecha_nacimiento) {
        const bd = new Date(data.fecha_nacimiento);
        const hoy = new Date();
        if (bd > hoy) {
          const error = new Error('La fecha de nacimiento no puede estar en el futuro.');
          error.status = 400;
          throw error;
        }
      }
      // Buscar si ya existe la cédula (incluso si está inactivo)
      if (data.cedula) {
        const existente = await habitanteModel.findOne({ where: { cedula: data.cedula } });
        if (existente) {
          if (existente.activo) {
            const error = new Error('Cédula ya registrada');
            error.name = 'SequelizeUniqueConstraintError';
            throw error;
          } else {
            // Reactivar el habitante eliminado con los nuevos datos
            const { id, cedula, fecha_creacion, ...datosNuevos } = data;
            await existente.update({ ...datosNuevos, activo: true });
            return this.enriquecerHabitante(existente);
          }
        }
      }

      const habitante = await habitanteModel.create(data);
      return this.enriquecerHabitante(habitante);
    } catch (error) {
      logger.error('Error creating/reactivating habitante:', error);
      throw error;
    }
  }

  /**
   * Listar habitantes
   */
  static async list(habitanteModel, filters = {}) {
    try {
      const where = { activo: true, ...filters };
      const habitantes = await habitanteModel.findAll({ where, limit: 100 });
      return habitantes.map(h => this.enriquecerHabitante(h));
    } catch (error) {
      logger.error('Error listing habitantes:', error);
      throw error;
    }
  }

  /**
   * Obtener habitante por ID con campos calculados
   */
  static async getById(habitanteModel, id) {
    try {
      const habitante = await habitanteModel.findByPk(id);
      if (!habitante) return null;
      return this.enriquecerHabitante(habitante);
    } catch (error) {
      logger.error('Error fetching habitante:', error);
      throw error;
    }
  }

  /**
   * Obtener habitantes por consejo con campos calculados
   */
  static async getPorConsejo(habitanteModel, consejoId) {
    try {
      const habitantes = await habitanteModel.findAll({
        where: { id_comunidad: consejoId, activo: true },
        order: [['nombre', 'ASC']]
      });
      
      return habitantes.map(h => this.enriquecerHabitante(h));
    } catch (error) {
      logger.error('Error fetching habitantes por consejo:', error);
      throw error;
    }
  }

  /**
   * Obtener electores de un consejo (mayores o iguales a 15 años)
   */
  static async getElectoresPorConsejo(habitanteModel, consejoId) {
    try {
      const habitantes = await this.getPorConsejo(habitanteModel, consejoId);
      return habitantes.filter(h => h.elector);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener menores de un consejo (menores a 15 años)
   */
  static async getMenoresPorConsejo(habitanteModel, consejoId) {
    try {
      const habitantes = await this.getPorConsejo(habitanteModel, consejoId);
      return habitantes.filter(h => !h.elector && h.edad !== null);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar habitantes por cédula o nombre
   */
  static async buscar(habitanteModel, termino) {
    try {
      const { Op } = require('sequelize');
      const cedulaNorm = termino.replace(/[.\s-]/g, '').replace(/^[VE]/i, '');
      const habitantes = await habitanteModel.findAll({
        where: {
          activo: true,
          [Op.or]: [
            { cedula: { [Op.like]: `%${cedulaNorm}%` } },
            { cedula: { [Op.like]: `%${termino}%` } },
            { nombres: { [Op.like]: `%${termino}%` } },
            { apellidos: { [Op.like]: `%${termino}%` } },
            habitanteModel.sequelize.where(
              habitanteModel.sequelize.fn('lower', habitanteModel.sequelize.fn('concat', habitanteModel.sequelize.col('nombres'), ' ', habitanteModel.sequelize.col('apellidos'))),
              { [Op.like]: `%${termino.toLowerCase()}%` }
            )
          ]
        },
        include: [{
          model: habitanteModel.sequelize.models.ConsejoComunal,
          as: 'consejo',
          attributes: ['id', 'nombre_comunidad']
        }],
        limit: 50
      });
      
      return habitantes.map(h => this.enriquecerHabitante(h));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas demográficas de un consejo
   */
  static async getEstadisticasPorConsejo(habitanteModel, consejoId) {
    try {
      const habitantes = await this.getPorConsejo(habitanteModel, consejoId);
      
      const estadisticas = {
        consejoId,
        totalHabitantes: habitantes.length,
        totalElectores: habitantes.filter(h => h.elector).length,
        totalMenores: habitantes.filter(h => !h.elector && h.edad !== null).length,
        porGenero: {},
        porCondicionSalud: {},
        rangosEdad: {
          '0-12': 0,
          '13-15': 0,
          '16-18': 0,
          '19-30': 0,
          '31-50': 0,
          '51-65': 0,
          '66+': 0
        }
      };

      // Contar por género y condición de salud
      habitantes.forEach(h => {
        // Género
        if (h.genero) {
          estadisticas.porGenero[h.genero] = (estadisticas.porGenero[h.genero] || 0) + 1;
        }

        // Condición de salud
        if (h.condicion_salud) {
          estadisticas.porCondicionSalud[h.condicion_salud] = 
            (estadisticas.porCondicionSalud[h.condicion_salud] || 0) + 1;
        }

        // Rango de edad
        if (h.edad !== null) {
          if (h.edad <= 12) estadisticas.rangosEdad['0-12']++;
          else if (h.edad <= 15) estadisticas.rangosEdad['13-15']++;
          else if (h.edad <= 18) estadisticas.rangosEdad['16-18']++;
          else if (h.edad <= 30) estadisticas.rangosEdad['19-30']++;
          else if (h.edad <= 50) estadisticas.rangosEdad['31-50']++;
          else if (h.edad <= 65) estadisticas.rangosEdad['51-65']++;
          else estadisticas.rangosEdad['66+']++;
        }
      });

      return estadisticas;
    } catch (error) {
      logger.error('Error calculating estadísticas:', error);
      throw error;
    }
  }

  /**
   * Actualizar habitante
   */
  static async update(habitanteModel, id, data) {
    try {
      if (data.fecha_nacimiento) {
        const bd = new Date(data.fecha_nacimiento);
        const hoy = new Date();
        if (bd > hoy) {
          const error = new Error('La fecha de nacimiento no puede estar en el futuro.');
          error.status = 400;
          throw error;
        }
      }
      const h = await habitanteModel.findByPk(id);
      if (!h) return null;
      await h.update(data);
      return this.enriquecerHabitante(h);
    } catch (error) {
      logger.error('Error updating habitante:', error);
      throw error;
    }
  }

  /**
   * Eliminar habitante (soft delete)
   */
  static async remove(habitanteModel, id) {
    try {
      const h = await habitanteModel.findByPk(id);
      if (!h) return null;
      await h.update({ activo: false });
      return this.enriquecerHabitante(h);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar todos los habitantes (paginado)
   */
  static async listar(habitanteModel, limit = 50, offset = 0, consejoId = null) {
    try {
      const where = { activo: true };
      if (consejoId) where.id_comunidad = consejoId;

      const { count, rows } = await habitanteModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [['fecha_creacion', 'DESC']]
      });

      return {
        total: count,
        habitantes: rows.map(h => this.enriquecerHabitante(h)),
        pagina: Math.floor(offset / limit) + 1,
        porPagina: limit
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = HabitantesService;
