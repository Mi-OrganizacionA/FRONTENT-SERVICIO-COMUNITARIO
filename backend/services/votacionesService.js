class VotacionesService {
  static async list(votacionModel, consejo_id = null) {
    const where = {};
    if (consejo_id) where.consejo_comunal_id = consejo_id;
    return await votacionModel.findAll({ where });
  }

  static async create(votacionModel, data) {
    return await votacionModel.create(data);
  }

  static async getById(votacionModel, id) {
    return await votacionModel.findByPk(id);
  }

  // registrarVoto se implementaría con tabla intermedia
  static async registrarVoto(_votacionModel, _userId, _opcion) {
    // Simulado
    return { mensaje: 'Voto registrado (simulado)' };
  }
}

module.exports = VotacionesService;
