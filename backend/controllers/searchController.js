const { Op } = require('sequelize');

class SearchController {
  static setModels(models) {
    this.models = models;
  }

  static async globalSearch(req, res, next) {
    try {
      const q = req.query.q || '';
      if (!q || q.trim().length < 2) {
        return res.json([]);
      }

      const query = `%${q.trim()}%`;
      const results = [];

      // 1. Buscar Habitantes (Cédula, Nombres, Apellidos)
      if (this.models.Habitante) {
        const habitantes = await this.models.Habitante.findAll({
          where: {
            [Op.or]: [
              { cedula: { [Op.like]: query } },
              { nombres: { [Op.like]: query } },
              { apellidos: { [Op.like]: query } }
            ]
          },
          limit: 5
        });

        habitantes.forEach(h => {
          results.push({
            tipo: 'habitante',
            id: h.id,
            titulo: `${h.nombres} ${h.apellidos}`,
            subtitulo: `C.I: ${h.cedula}`,
            url: `censo.html?viewHabitante=${h.id}`
          });
        });
      }

      // 2. Buscar Usuarios / Voceros (Email, Nombre)
      if (this.models.Usuario) {
        const usuarios = await this.models.Usuario.findAll({
          where: {
            [Op.or]: [
              { email: { [Op.like]: query } },
              { nombre: { [Op.like]: query } }
            ],
            rol: 'vocero'
          },
          limit: 5
        });

        usuarios.forEach(u => {
          results.push({
            tipo: 'vocero',
            id: u.id,
            titulo: u.nombre,
            subtitulo: `Correo: ${u.email}`,
            url: `voceros.html?viewVocero=${u.id}`
          });
        });
      }

      // 3. Buscar Configuraciones
      if (this.models.Configuracion) {
        const configuraciones = await this.models.Configuracion.findAll({
          where: {
            [Op.or]: [
              { clave: { [Op.like]: query } },
              { descripcion: { [Op.like]: query } }
            ]
          },
          limit: 5
        });

        configuraciones.forEach(c => {
          results.push({
            tipo: 'configuracion',
            id: c.id,
            titulo: c.clave,
            subtitulo: c.descripcion || 'Configuración del sistema',
            url: `configuracion.html?highlightConfig=${c.id}`
          });
        });
      }

      // 4. Buscar en Censo Característica Familiar (Integrantes de Vivienda)
      if (this.models.CensoCaracteristicaFamiliar) {
        const familiares = await this.models.CensoCaracteristicaFamiliar.findAll({
          where: {
            [Op.or]: [
              { cedula: { [Op.like]: query } },
              { nombres_apellidos: { [Op.like]: query } }
            ]
          },
          limit: 5
        });

        familiares.forEach(f => {
          results.push({
            tipo: 'familiar_vivienda',
            id: f.id,
            titulo: f.nombres_apellidos,
            subtitulo: `Familiar en Censo de Vivienda (C.I: ${f.cedula || 'N/A'})`,
            url: `censo_viviendas.html?viewVivienda=${f.id_estudio}&highlightFamiliar=${f.id}`
          });
        });
      }

      // Mezclar y retornar (máximo 15 resultados en total para no saturar)
      res.json(results.slice(0, 15));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SearchController;
