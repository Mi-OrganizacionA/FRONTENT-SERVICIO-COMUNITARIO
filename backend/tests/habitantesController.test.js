const habitantesService = require('../services/habitantesService');

describe('HabitantesService — cálculos dinámicos', () => {

  describe('calcularEdad()', () => {
    it('calcula la edad correctamente para 20 años', () => {
      const fn = new Date();
      fn.setFullYear(fn.getFullYear() - 20);
      expect(habitantesService.calcularEdad(fn)).toBe(20);
    });

    it('calcula la edad correctamente para 0 años (recién nacido)', () => {
      const fn = new Date();
      expect(habitantesService.calcularEdad(fn)).toBe(0);
    });

    it('considera el día exacto de cumpleaños: un día antes NO cumple años aún', () => {
      const fn = new Date();
      fn.setFullYear(fn.getFullYear() - 18);
      fn.setDate(fn.getDate() + 1); // Cumpleaños es mañana
      expect(habitantesService.calcularEdad(fn)).toBe(17);
    });

    it('retorna null si no hay fecha de nacimiento', () => {
      expect(habitantesService.calcularEdad(null)).toBeNull();
      expect(habitantesService.calcularEdad(undefined)).toBeNull();
    });
  });

  describe('esElector()', () => {
    it('persona de 16 años ES elector', () => {
      const fn = new Date();
      fn.setFullYear(fn.getFullYear() - 16);
      expect(habitantesService.esElector(fn)).toBe(true);
    });

    it('persona de 15 años ES elector (límite exacto)', () => {
      const fn = new Date();
      fn.setFullYear(fn.getFullYear() - 15);
      expect(habitantesService.esElector(fn)).toBe(true);
    });

    it('persona de 14 años NO es elector', () => {
      const fn = new Date();
      fn.setFullYear(fn.getFullYear() - 14);
      fn.setDate(fn.getDate() - 1); // Asegurar que no cumplió 15 hoy
      expect(habitantesService.esElector(fn)).toBe(false);
    });

    it('retorna false si fecha es null', () => {
      expect(habitantesService.esElector(null)).toBe(false);
    });
  });

  describe('enriquecerHabitante()', () => {
    it('agrega campos calculados: edad y elector', () => {
      const fn = new Date();
      fn.setFullYear(fn.getFullYear() - 25);

      const habitanteMock = {
        toJSON: () => ({
          id: 1,
          nombres: 'Juan',
          apellidos: 'Pérez',
          cedula: '12345678',
          fecha_nacimiento: fn.toISOString()
        })
      };

      const resultado = habitantesService.enriquecerHabitante(habitanteMock);

      expect(resultado).toHaveProperty('edad', 25);
      expect(resultado).toHaveProperty('elector', true);
      expect(resultado.nombres).toBe('Juan');
    });

    it('funciona con plain object (sin toJSON)', () => {
      const fn = new Date();
      fn.setFullYear(fn.getFullYear() - 10);

      const resultado = habitantesService.enriquecerHabitante({
        id: 2,
        nombres: 'María',
        fecha_nacimiento: fn.toISOString()
      });

      expect(resultado.edad).toBe(10);
      expect(resultado.elector).toBe(false);
    });
  });

  describe('remove() — soft delete', () => {
    it('establece activo=false en lugar de eliminar el registro', async () => {
      let updatedData = null;
      const mockHabModel = {
        findByPk: jest.fn(async () => ({
          update: jest.fn(async (data) => { updatedData = data; }),
          toJSON: () => ({ id: 1, activo: false })
        }))
      };

      await habitantesService.remove(mockHabModel, 1);

      expect(mockHabModel.findByPk).toHaveBeenCalledWith(1);
      expect(updatedData).toEqual({ activo: false });
    });

    it('retorna null si el habitante no existe', async () => {
      const mockHabModel = {
        findByPk: jest.fn(async () => null)
      };

      const resultado = await habitantesService.remove(mockHabModel, 999);
      expect(resultado).toBeNull();
    });
  });
});