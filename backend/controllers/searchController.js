const { Op } = require('sequelize');

class SearchController {
  static setModels(models) {
    this.models = models;
  }

  static _normalizeCedula(q) {
    return q.replace(/[.\s-]/g, '').replace(/^[VE]/i, '');
  }

  static async globalSearch(req, res, next) {
    try {
      const q = req.query.q || '';
      if (!q || q.trim().length < 2) {
        return res.json([]);
      }

      const raw = q.trim();
      const query = `%${raw}%`;
      const cedulaQuery = `%${this._normalizeCedula(raw)}%`;
      const results = [];

      // 1. Buscar Habitantes
      if (this.models.Habitante) {
        try {
          const habitantes = await this.models.Habitante.findAll({
            where: {
              activo: true,
              [Op.or]: [
                { cedula: { [Op.like]: cedulaQuery } },
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
        } catch (err) {
          console.error('Error buscando habitantes:', err.message);
        }
      }

      // 2. Buscar Consejos Comunales
      if (this.models.ConsejoComunal) {
        try {
          const consejos = await this.models.ConsejoComunal.findAll({
            where: { nombre_comunidad: { [Op.like]: query } },
            limit: 5
          });
          consejos.forEach(c => {
            results.push({
              tipo: 'seccion',
              id: c.id,
              titulo: c.nombre_comunidad,
              subtitulo: 'Consejo Comunal',
              url: `censo.html?highlightSection=${encodeURIComponent(c.nombre_comunidad)}`
            });
          });
        } catch (err) {
          console.error('Error buscando consejos:', err.message);
        }
      }

      // 3. Buscar Voceros
      if (this.models.Usuario) {
        try {
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
        } catch (err) {
          console.error('Error buscando voceros:', err.message);
        }
      }

      // 4. Buscar Configuraciones
      if (this.models.Configuracion) {
        try {
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
        } catch (err) {
          console.error('Error buscando configuraciones:', err.message);
        }
      }

      // 5. Buscar familiares en censo de viviendas
      if (this.models.CensoCaracteristicaFamiliar) {
        try {
          const familiares = await this.models.CensoCaracteristicaFamiliar.findAll({
            where: {
              [Op.or]: [
                { cedula_identidad: { [Op.like]: cedulaQuery } },
                { cedula_identidad: { [Op.like]: query } },
                { nombres_apellidos: { [Op.like]: query } }
              ]
            },
            limit: 5
          });

          familiares.forEach(f => {
            results.push({
              tipo: 'familiar_vivienda',
              id: f.id_familiar,
              titulo: f.nombres_apellidos,
              subtitulo: `Familiar en Censo de Vivienda (C.I: ${f.cedula_identidad || 'N/A'})`,
              url: `censo_viviendas.html?viewVivienda=${f.id_estudio}&highlightFamiliar=${f.id_familiar}`
            });
          });
        } catch (err) {
          console.error('Error buscando familiares:', err.message);
        }
      }

      res.json(results.slice(0, 15));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SearchController;
