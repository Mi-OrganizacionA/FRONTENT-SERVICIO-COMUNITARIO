const AuditService = require('../services/auditService');

describe('AuditService', () => {

  beforeEach(() => {
    // Resetear modelo antes de cada test
    AuditService.setModel(null);
  });

  describe('mes_ano', () => {
    it('calcula mes_ano en formato YYYY-MM correctamente', async () => {
      // Crear modelo mock que captura el llamado
      let capturedData = null;
      const mockModel = {
        create: jest.fn(async (data) => {
          capturedData = data;
          return { id: 1, ...data };
        })
      };
      AuditService.setModel(mockModel);

      await AuditService.log(1, 'CREATE', 'habitantes', 99, null, { test: true });

      expect(capturedData).not.toBeNull();
      // Formato YYYY-MM
      expect(capturedData.mes_ano).toMatch(/^\d{4}-\d{2}$/);
      // El mes/año debe ser el actual
      const now = new Date();
      const expectedMesAno = now.toISOString().substring(0, 7);
      expect(capturedData.mes_ano).toBe(expectedMesAno);
    });

    it('registra todos los campos requeridos en el log', async () => {
      let capturedData = null;
      const mockModel = {
        create: jest.fn(async (data) => {
          capturedData = data;
          return { id: 1, ...data };
        })
      };
      AuditService.setModel(mockModel);

      await AuditService.log(
        5,
        'UPDATE',
        'proyectos',
        42,
        { nombre: 'Antes' },
        { nombre: 'Después' },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(capturedData.id_usuario).toBe(5);
      expect(capturedData.accion).toBe('UPDATE');
      expect(capturedData.tabla_afectada).toBe('proyectos');
      expect(capturedData.registro_id).toBe(42);
      expect(capturedData.ip_address).toBe('192.168.1.1');
      expect(capturedData.user_agent).toBe('Mozilla/5.0');
    });
  });

  describe('fallback sin modelo', () => {
    it('no lanza error si el modelo no está inicializado', async () => {
      // AuditService sin modelo — debe log a consola sin lanzar
      await expect(
        AuditService.log(1, 'CREATE', 'test', 1, null, null)
      ).resolves.not.toThrow();
    });
  });

  describe('cleanOldLogs', () => {
    it('retorna 0 cuando no hay modelo configurado', async () => {
      const result = await AuditService.cleanOldLogs(24);
      expect(result).toBe(0);
    });

    it('llama a destroy con la fecha de corte correcta', async () => {
      const { Op } = require('sequelize');
      let destroyArgs = null;
      const mockModel = {
        destroy: jest.fn(async (args) => {
          destroyArgs = args;
          return 5; // 5 registros eliminados
        })
      };
      AuditService.setModel(mockModel);

      const resultado = await AuditService.cleanOldLogs(24);

      expect(resultado).toBe(5);
      expect(destroyArgs).not.toBeNull();
      expect(destroyArgs.where).toHaveProperty('fecha');
    });
  });

  describe('getLogs', () => {
    it('retorna array vacío si no hay modelo', async () => {
      const logs = await AuditService.getLogs({});
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(0);
    });

    it('aplica filtros correctamente', async () => {
      let capturedWhere = null;
      const mockModel = {
        findAll: jest.fn(async ({ where }) => {
          capturedWhere = where;
          return [];
        })
      };
      AuditService.setModel(mockModel);

      await AuditService.getLogs({ userId: 3, action: 'DELETE', table: 'habitantes' });

      expect(capturedWhere.id_usuario).toBe(3);
      expect(capturedWhere.accion).toBe('DELETE');
      expect(capturedWhere.tabla_afectada).toBe('habitantes');
    });
  });
});