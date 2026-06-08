const bandejaValidacionesController = require('../controllers/bandejaValidacionesController');
const AuditService = require('../services/auditService');

jest.mock('../services/auditService');

describe('BandejaValidacionesController', () => {

  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1, rol: 'vocero' },
      body: {},
      params: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('validarDocumento', () => {
    it('debe aprobar un documento correctamente y registrar auditoría', async () => {
      req.params.id = 1;
      req.body = { accion: 'aprobar', comentario: 'Todo bien' };

      const mockDoc = {
        id: 1,
        estado: 'pendiente',
        save: jest.fn().mockResolvedValue(true)
      };
      ValidacionFirma.findByPk.mockResolvedValue(mockDoc);

      await bandejaValidacionesController.validarDocumento(req, res);

      expect(ValidacionFirma.findByPk).toHaveBeenCalledWith(1);
      expect(mockDoc.estado).toBe('aprobado');
      expect(mockDoc.revisado_por).toBe(1);
      expect(mockDoc.comentario_revision).toBe('Todo bien');
      expect(mockDoc.fecha_revision).toBeDefined();
      expect(mockDoc.save).toHaveBeenCalled();
      
      expect(AuditService.log).toHaveBeenCalledWith(
        1, 'UPDATE', 'bandeja_validaciones', 1, null, expect.any(Object), '127.0.0.1', 'jest'
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Documento aprobado exitosamente.'
      }));
    });

    it('debe rechazar un documento y exigir comentario', async () => {
      req.params.id = 1;
      req.body = { accion: 'rechazar' }; // Falta comentario

      const mockDoc = { id: 1, estado: 'pendiente' };
      ValidacionFirma.findByPk.mockResolvedValue(mockDoc);

      await bandejaValidacionesController.validarDocumento(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Debe proporcionar un comentario explicando el rechazo.'
      });
      expect(mockDoc.estado).toBe('pendiente'); // No debe cambiar
    });

    it('retorna 404 si el documento no existe', async () => {
      req.params.id = 999;
      req.body = { accion: 'aprobar' };
      ValidacionFirma.findByPk.mockResolvedValue(null);

      await bandejaValidacionesController.validarDocumento(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Documento no encontrado.'
      });
    });
  });

  describe('getDocumentosPendientes', () => {
    it('debe listar solo documentos con estado pendiente', async () => {
      ValidacionFirma.findAll.mockResolvedValue([
        { id: 1, estado: 'pendiente' },
        { id: 2, estado: 'pendiente' }
      ]);

      await bandejaValidacionesController.getDocumentosPendientes(req, res);

      expect(ValidacionFirma.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { estado: 'pendiente' }
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
      expect(res.json.mock.calls[0][0].data.length).toBe(2);
    });
  });
});