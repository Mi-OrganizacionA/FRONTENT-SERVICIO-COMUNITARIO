const { Op } = require('sequelize');

class SearchController {
  static setModels(models) {
    this.models = models;
  }

  static _generateCedulaVariations(q) {
    const raw = q.trim();
    const num = raw.replace(/[.\s-]/g, '').replace(/^[VE]/i, '');
    if (!num || isNaN(num)) return [`%${raw}%`];

    // Formatear con puntos (ej: 12345678 -> 12.345.678)
    const formatDots = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const dots = formatDots(num);

    const vars = new Set([
      `%${num}%`,
      `%V-${num}%`, `%E-${num}%`,
      `%V${num}%`, `%E${num}%`,
      `%${dots}%`,
      `%V-${dots}%`, `%E-${dots}%`,
      `%V${dots}%`, `%E${dots}%`,
      `%${raw}%`
    ]);

    return Array.from(vars);
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
      const cedulaVariations = this._generateCedulaVariations(raw);
      const results = [];

      // 1. Buscar Habitantes y Jefe de Familia
      if (this.models.Habitante) {
        try {
          const whereClause = {
            activo: true,
            [Op.or]: [
              ...cedulaVariations.map(v => ({ cedula: { [Op.like]: v } })),
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
                ...cedulaVariations.map(v => ({ cedula_identidad: { [Op.like]: v } })),
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
      // 7. Módulos y Secciones Estáticas del Frontend (excepto login, voceros, index)
      const term = raw.toLowerCase();
      if (term.length >= 2) {
        const modulos = [
          { titulo: 'Bandeja de Entrada', subtitulo: 'Módulo de solicitudes', url: 'bandeja.html', keywords: ['bandeja', 'solicitudes', 'mensajes', 'aprobaciones', 'entrada'] },
          { titulo: 'Reportes y Gráficas Estadísticas', subtitulo: 'Módulo de estadísticas', url: 'reportes.html', keywords: ['reportes', 'graficas', 'estadisticas', 'estadísticas', 'gráficas', 'kpi', 'dashboard'] },
          { titulo: 'Habitantes', subtitulo: 'Módulo de censo', url: 'censo.html', keywords: ['habitantes', 'censo', 'personas', 'registro'] },
          { titulo: 'Censo de Viviendas', subtitulo: 'Módulo de viviendas', url: 'censo_viviendas.html', keywords: ['viviendas', 'censo viviendas', 'casas', 'hogares', 'estudio demografico'] },
          { titulo: 'Organizaciones Sociales', subtitulo: 'Módulo de organizaciones', url: 'organizaciones.html', keywords: ['organizaciones', 'comites', 'sociales'] },
          { titulo: 'Proyectos Agroecológicos', subtitulo: 'Módulo de proyectos', url: 'proyectos.html', keywords: ['proyectos', 'agroecologicos'] },
          { titulo: 'Cartelera Digital', subtitulo: 'Módulo de noticias', url: 'noticias.html', keywords: ['cartelera', 'noticias', 'digital', 'informacion'] },
          { titulo: 'Configuración de Perfil', subtitulo: 'Módulo de perfil', url: 'perfil.html', keywords: ['configuracion', 'perfil', 'ajustes', 'contraseña', 'datos'] },
          { titulo: 'Producción Agrícola', subtitulo: 'Módulo de producción', url: 'produccion_agricola.html', keywords: ['produccion', 'agricola', 'productores', 'rubros', 'siembra'] },
          { titulo: 'Estructura CLAP', subtitulo: 'Módulo CLAP', url: 'estructura_clap.html', keywords: ['clap', 'estructura', 'comite local', 'abastecimiento'] },
          { titulo: 'Jefes de Calle', subtitulo: 'Módulo de jefes de calle', url: 'jefe_calle.html', keywords: ['jefes', 'calle', 'jefe de calle', 'lideres'] },
        ];

        modulos.forEach(m => {
          const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          const termNorm = normalize(term);
          
          const matchTitle = normalize(m.titulo).includes(termNorm);
          const matchKeys = m.keywords.some(k => normalize(k).includes(termNorm) || termNorm.includes(normalize(k)));
          
          if (matchTitle || matchKeys) {
            results.push({
              tipo: 'seccion',
              id: 'mod_' + m.url,
              titulo: m.titulo,
              subtitulo: `Sección del Sistema / ${m.subtitulo}`,
              url: m.url
            });
          }
        });
      }

      res.json(results.slice(0, 20)); // Limite total
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SearchController;
