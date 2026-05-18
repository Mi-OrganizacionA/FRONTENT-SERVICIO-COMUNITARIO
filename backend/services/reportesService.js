class ReportesService {
  static async list(reporteModel, filters = {}) {
    return await reporteModel.findAll({ where: filters, order: [['fecha','DESC']] });
  }

  static async getById(reporteModel, id) {
    return await reporteModel.findByPk(id);
  }

  static async create(reporteModel, data) {
    return await reporteModel.create(data);
  }

  static async update(reporteModel, id, data) {
    const reporte = await reporteModel.findByPk(id);
    if (!reporte) return null;
    await reporte.update(data);
    return reporte;
  }

  static async remove(reporteModel, id) {
    const reporte = await reporteModel.findByPk(id);
    if (!reporte) return null;
    await reporte.destroy();
    return reporte;
  }
}

module.exports = ReportesService;
