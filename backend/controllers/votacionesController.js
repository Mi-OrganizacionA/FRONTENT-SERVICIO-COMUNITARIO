const logger = require('../utils/logger');
let VotacionModel = null;

class VotacionesController {
  static async getAbiertas(req, res) {
    try {
      const { consejo_id } = req.params;
      const abiertas = await VotacionModel.findAll({ where: { consejo_comunal_id: consejo_id, activa: true } });
      res.json(abiertas);
    } catch (error) {
      logger.error('Error obteniendo votaciones abiertas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async registrarVoto(req, res) {
    try {
      const { votacion_id } = req.params;
      // lógica simplificada: crear registro de voto en tabla asociada (no implementada)
      res.json({ mensaje: 'Voto registrado (simulado)' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const votaciones = await VotacionModel.findAll();
      res.json(votaciones);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const voto = await VotacionModel.create(req.body);
      res.status(201).json(voto);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getResultado(req, res) {
    try {
      const { id } = req.params;
      // cálculo de resultado simplificado
      res.json({ resultado: 'No implementado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static setModel(model) { VotacionModel = model; }
}

module.exports = VotacionesController;
