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

      const user = req.user;
      const isVocero = user && user.rol === 'vocero';
      const userCC = user ? (user.id_comunidad_asignada || user.consejo_comunal_id || user.consejoComunal) : null;

      const raw = q.trim();
      const query = `%${raw}%`;
      const cedulaQuery = `%${this._normalizeCedula(raw)}%`;
      const results = [];

      // 1. Buscar Habitantes y Jefe de Familia
      if (this.models.Habitante) {
        try {
          const whereClause = {
            activo: true,
            [Op.or]: [
              { cedula: { [Op.like]: cedulaQuery } },
              { cedula: { [Op.like]: query } },
              { nombres: { [Op.like]: query } },
              { apellidos: { [Op.like]: query } }
            ]
          };
          
          if (isVocero && userCC) {
            whereClause.consejo_comunal_id = userCC;
          }

          const habitantes = await this.models.Habitante.findAll({
            where: whereClause,
            limit: 10
          });

          for (const h of habitantes) {
            // Habitante normal -> censo
            results.push({
              tipo: 'habitante',
              id: h.id,
              titulo: `${h.nombres} ${h.apellidos}`,
              subtitulo: `C.I: ${h.cedula} - Habitante`,
              url: `censo.html?viewHabitante=${h.id}`
            });

            // Si es Jefe de familia -> censo_vivienda (buscamos en EstudioDemografico)
            if (this.models.EstudioDemografico) {
              const estudio = await this.models.EstudioDemografico.findOne({
                where: {
                  activo: true,
                  encuestado_cedula: h.cedula
                }
              });
              if (estudio) {
                results.push({
                  tipo: 'familiar_vivienda', // usa icono de familia
                  id: estudio.id,
                  titulo: `${h.nombres} ${h.apellidos}`,
                  subtitulo: `C.I: ${h.cedula} - Jefe de Familia`,
                  url: `censo_viviendas.html?viewVivienda=${estudio.id}`
                });
              }
            }
          }
        } catch (err) {
          console.error('Error buscando habitantes:', err.message);
        }
      }

      // 2. Buscar familiares/integrantes en censo de viviendas
      if (this.models.CensoCaracteristicaFamiliar) {
        try {
          const includeParams = [];
          if (isVocero && userCC && this.models.EstudioDemografico) {
            includeParams.push({
              model: this.models.EstudioDemografico,
              as: 'estudio',
              where: { id_comunidad: userCC },
              required: true
            });
          }

          const familiares = await this.models.CensoCaracteristicaFamiliar.findAll({
            where: {
              [Op.or]: [
                { cedula_identidad: { [Op.like]: cedulaQuery } },
                { cedula_identidad: { [Op.like]: query } },
                { nombres_apellidos: { [Op.like]: query } }
              ]
            },
            include: includeParams,
            limit: 5
          });

          familiares.forEach(f => {
            results.push({
              tipo: 'familiar_vivienda',
              id: f.id_familiar,
              titulo: f.nombres_apellidos,
              subtitulo: `C.I: ${f.cedula_identidad || 'N/A'} - Integrante Familia`,
              url: `censo_viviendas.html?viewVivienda=${f.id_estudio}&highlightFamiliar=${f.id_familiar}`
            });
          });
        } catch (err) {
          console.error('Error buscando familiares:', err.message);
        }
      }

      // 3. Buscar Noticias (Global, sin filtro de comunidad según instrucción del usuario)
      if (this.models.CarteleraDigital) {
        try {
          const noticias = await this.models.CarteleraDigital.findAll({
            where: {
              activo: true,
              [Op.or]: [
                { titulo: { [Op.like]: query } },
                { contenido: { [Op.like]: query } }
              ]
            },
            limit: 5
          });
          noticias.forEach(n => {
            results.push({
              tipo: 'seccion',
              id: n.id,
              titulo: n.titulo,
              subtitulo: 'Cartelera Digital / Noticia',
              url: `noticias.html?viewNoticia=${n.id}`
            });
          });
        } catch (err) {
          console.error('Error buscando noticias:', err.message);
        }
      }

      // 4. Buscar Organizaciones Sociales
      if (this.models.OrganizacionSocial) {
        try {
          const whereClause = {
            activo: true,
            [Op.or]: [
              { nombre_organizacion: { [Op.like]: query } },
              { tipo_organizacion: { [Op.like]: query } }
            ]
          };
          if (isVocero && userCC) whereClause.id_comunidad = userCC;

          const organizaciones = await this.models.OrganizacionSocial.findAll({
            where: whereClause,
            limit: 5
          });
          organizaciones.forEach(o => {
            results.push({
              tipo: 'seccion',
              id: o.id,
              titulo: o.nombre_organizacion,
              subtitulo: `Organización: ${o.tipo_organizacion}`,
              url: `organizaciones.html?viewOrganizacion=${o.id}`
            });
          });
        } catch (err) {
          console.error('Error buscando organizaciones:', err.message);
        }
      }

      // 5. Buscar Proyectos Agroecológicos
      if (this.models.Proyecto) {
        try {
          const whereClause = {
            [Op.or]: [
              { titulo: { [Op.like]: query } },
              { descripcion: { [Op.like]: query } }
            ]
          };
          if (isVocero && userCC) whereClause.id_comunidad = userCC;

          const proyectos = await this.models.Proyecto.findAll({
            where: whereClause,
            limit: 5
          });
          proyectos.forEach(p => {
            results.push({
              tipo: 'seccion',
              id: p.id,
              titulo: p.titulo,
              subtitulo: 'Proyecto Agroecológico',
              url: `proyectos.html?viewProyecto=${p.id}`
            });
          });
        } catch (err) {
          console.error('Error buscando proyectos:', err.message);
        }
      }

      // 6. Buscar Producción Agrícola
      if (this.models.ProduccionAgricola) {
        try {
          const includeParams = [];
          if (isVocero && userCC && this.models.Habitante) {
            includeParams.push({
              model: this.models.Habitante,
              as: 'productor',
              where: { consejo_comunal_id: userCC },
              required: true
            });
          }

          const produccion = await this.models.ProduccionAgricola.findAll({
            where: {
              activo: true,
              rubro: { [Op.like]: query }
            },
            include: includeParams,
            limit: 5
          });
          produccion.forEach(p => {
            results.push({
              tipo: 'seccion',
              id: p.id,
              titulo: p.rubro,
              subtitulo: 'Producción Agrícola',
              url: `produccion_agricola.html?viewProduccion=${p.id}`
            });
          });
        } catch (err) {
          console.error('Error buscando produccion:', err.message);
        }
      }

      res.json(results.slice(0, 20)); // Limite total
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SearchController;
