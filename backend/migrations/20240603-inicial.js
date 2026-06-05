module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('consejos_comunales', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(150), allowNull: false },
      descripcion: Sequelize.TEXT,
      direccion: Sequelize.TEXT,
      telefono: Sequelize.STRING(20),
      email: Sequelize.STRING(100),
      activo: { type: Sequelize.BOOLEAN, defaultValue: true },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('usuarios', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      usuario: { type: Sequelize.STRING(50), unique: true, allowNull: false },
      contraseña: { type: Sequelize.STRING(255), allowNull: false },
      rol: { type: Sequelize.ENUM('admin', 'vocero'), allowNull: false },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      email: Sequelize.STRING(100),
      consejo_comunal_id: {
        type: Sequelize.INTEGER,
        references: { model: 'consejos_comunales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      activo: { type: Sequelize.BOOLEAN, defaultValue: true },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      ultimo_login: Sequelize.DATE
    });

    await queryInterface.createTable('habitantes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      cedula: { type: Sequelize.STRING(8), unique: true, allowNull: false },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      apellido: { type: Sequelize.STRING(100), allowNull: false },
      edad: Sequelize.INTEGER,
      genero: { type: Sequelize.ENUM('M', 'F', 'Otro'), allowNull: false },
      email: Sequelize.STRING(100),
      telefono: Sequelize.STRING(20),
      direccion: Sequelize.TEXT,
      consejo_comunal_id: {
        type: Sequelize.INTEGER,
        references: { model: 'consejos_comunales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        allowNull: false
      },
      clasificacion: { type: Sequelize.ENUM('adulto', 'niño', 'adulto_mayor', 'discapacitado', 'encamado') },
      elector: { type: Sequelize.BOOLEAN, defaultValue: true },
      foto_cedula_url: Sequelize.STRING(500),
      centro_electoral: Sequelize.STRING(100),
      fecha_registro: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      activo: { type: Sequelize.BOOLEAN, defaultValue: true }
    });

    await queryInterface.createTable('proyectos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: { type: Sequelize.STRING(200), allowNull: false },
      descripcion: Sequelize.TEXT,
      estado: { type: Sequelize.ENUM('propuesto', 'aprobado', 'rechazado', 'en_ejecucion', 'finalizado'), defaultValue: 'propuesto' },
      presupuesto: Sequelize.DECIMAL,
      consejo_comunal_id: {
        type: Sequelize.INTEGER,
        references: { model: 'consejos_comunales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('votaciones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: { type: Sequelize.STRING(200), allowNull: false },
      descripcion: Sequelize.TEXT,
      consejo_comunal_id: {
        type: Sequelize.INTEGER,
        references: { model: 'consejos_comunales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fecha_inicio: Sequelize.DATE,
      fecha_fin: Sequelize.DATE,
      activa: { type: Sequelize.BOOLEAN, defaultValue: true }
    });

    await queryInterface.createTable('noticias', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: { type: Sequelize.STRING(200), allowNull: false },
      contenido: Sequelize.TEXT,
      publicado: { type: Sequelize.BOOLEAN, defaultValue: false },
      fecha_publicacion: Sequelize.DATE
    });

    await queryInterface.createTable('viviendas', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      direccion: Sequelize.TEXT,
      consejo_comunal_id: {
        type: Sequelize.INTEGER,
        references: { model: 'consejos_comunales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      tipo: Sequelize.STRING(50),
      tamaño_m2: Sequelize.FLOAT
    });

    await queryInterface.createTable('reportes_7t', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: Sequelize.STRING(200),
      contenido: Sequelize.TEXT,
      consejo_comunal_id: {
        type: Sequelize.INTEGER,
        references: { model: 'consejos_comunales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fecha: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('reportes_7t');
    await queryInterface.dropTable('viviendas');
    await queryInterface.dropTable('noticias');
    await queryInterface.dropTable('votaciones');
    await queryInterface.dropTable('proyectos');
    await queryInterface.dropTable('habitantes');
    await queryInterface.dropTable('usuarios');
    await queryInterface.dropTable('consejos_comunales');
  }
};
