class NoticiasService {
  static async list(noticiaModel, onlyPublished = true) {
    const where = {};
    if (onlyPublished) where.publicado = true;
    return await noticiaModel.findAll({ where, order: [['fecha_publicacion','DESC']] });
  }

  static async getById(noticiaModel, id) {
    return await noticiaModel.findByPk(id);
  }

  static async create(noticiaModel, data) {
    if (!data.fecha_publicacion && data.publicado) {
      data.fecha_publicacion = new Date();
    }
    return await noticiaModel.create(data);
  }

  static async update(noticiaModel, id, data) {
    const noticia = await noticiaModel.findByPk(id);
    if (!noticia) return null;
    await noticia.update(data);
    return noticia;
  }

  static async remove(noticiaModel, id) {
    const noticia = await noticiaModel.findByPk(id);
    if (!noticia) return null;
    await noticia.destroy();
    return noticia;
  }
}

module.exports = NoticiasService;
