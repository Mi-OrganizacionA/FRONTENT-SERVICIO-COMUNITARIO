class ProyectosService {
  static async list(proyectoModel, filters = {}) {
    const where = { ...filters };
    return await proyectoModel.findAll({ where, order: [['fecha_creacion','DESC']] });
  }

  static async getById(proyectoModel, id) {
    return await proyectoModel.findByPk(id);
  }

  static async create(proyectoModel, data) {
    return await proyectoModel.create(data);
  }

  static async update(proyectoModel, id, data) {
    const proyecto = await proyectoModel.findByPk(id);
    if (!proyecto) return null;
    await proyecto.update(data);
    return proyecto;
  }

  static async remove(proyectoModel, id) {
    const proyecto = await proyectoModel.findByPk(id);
    if (!proyecto) return null;
    await proyecto.destroy();
    return proyecto;
  }
}

module.exports = ProyectosService;
