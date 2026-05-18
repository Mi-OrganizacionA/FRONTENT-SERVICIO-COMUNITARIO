class HabitantesService {
  static async list(habitanteModel, filters = {}) {
    const where = { activo: true, ...filters };
    return await habitanteModel.findAll({ where, limit: 100 });
  }

  static async getById(habitanteModel, id) {
    return await habitanteModel.findByPk(id);
  }

  static async create(habitanteModel, data) {
    return await habitanteModel.create(data);
  }

  static async update(habitanteModel, id, data) {
    const h = await habitanteModel.findByPk(id);
    if (!h) return null;
    await h.update(data);
    return h;
  }

  static async remove(habitanteModel, id) {
    const h = await habitanteModel.findByPk(id);
    if (!h) return null;
    await h.update({ activo: false });
    return h;
  }
}

module.exports = HabitantesService;
