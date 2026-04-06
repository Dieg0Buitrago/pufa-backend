import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carga variables de entorno desde .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Seed inicial de la base de datos PUFA-Backend
// Ejecutar con: npx ts-node -r tsconfig-paths/register src/database/seeds/seed.ts

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  // Acepta DB_DATABASE o DB_NAME
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'pufa_db',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // --- ESTADOS DE CUENTA ---
    await qr.query(`
      INSERT INTO estados_cuenta (codigo, nombre, activo) VALUES
        ('pendiente', 'Pendiente de aprobación', true),
        ('activo', 'Activo', true),
        ('suspendido', 'Suspendido', true),
        ('rechazado', 'Rechazado', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- TIPOS DE PERFIL ---
    await qr.query(`
      INSERT INTO tipos_perfil (codigo, nombre, descripcion, activo) VALUES
        ('admin', 'Administrador', 'Personal de la Secretaría de Cultura y Comisión Fílmica de Boyacá', true),
        ('productora', 'Productora', 'Empresa o persona que solicita permisos de rodaje', true),
        ('proveedor', 'Proveedor', 'Prestador de servicios audiovisuales registrado en el directorio', true),
        ('academico', 'Académico', 'Estudiante o investigador con aval institucional', true),
        ('revisor', 'Revisor', 'Funcionario encargado de revisar y emitir conceptos sobre trámites PUFA', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- ROLES ---
    await qr.query(`
      INSERT INTO roles (codigo, nombre, descripcion, activo) VALUES
        ('admin', 'Administrador', 'Acceso total al sistema', true),
        ('productora', 'Productora', 'Crear y gestionar sus propios trámites', true),
        ('proveedor', 'Proveedor', 'Gestionar su perfil y disponibilidad en el directorio', true),
        ('academico', 'Académico', 'Acceso de aprendizaje y consulta', true),
        ('revisor', 'Revisor', 'Revisar y aprobar trámites asignados', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- PERMISOS ---
    await qr.query(`
      INSERT INTO permisos (codigo, nombre, descripcion, modulo, activo) VALUES
        ('tramites.ver', 'Ver trámites', 'Consultar listado y detalle de trámites', 'tramites', true),
        ('tramites.crear', 'Crear trámites', 'Crear nuevas solicitudes de permiso', 'tramites', true),
        ('tramites.editar', 'Editar trámites', 'Modificar trámites propios en borrador', 'tramites', true),
        ('tramites.aprobar', 'Aprobar trámites', 'Aprobar solicitudes de permiso', 'tramites', true),
        ('tramites.rechazar', 'Rechazar trámites', 'Rechazar solicitudes de permiso', 'tramites', true),
        ('tramites.admin', 'Administrar trámites', 'Acceso completo al módulo de trámites', 'tramites', true),
        ('usuarios.ver', 'Ver usuarios', 'Consultar listado de usuarios', 'usuarios', true),
        ('usuarios.gestionar', 'Gestionar usuarios', 'Crear y editar usuarios', 'usuarios', true),
        ('usuarios.aprobar', 'Aprobar usuarios', 'Aprobar solicitudes de registro', 'usuarios', true),
        ('pagos.ver', 'Ver pagos', 'Consultar información de pagos', 'pagos', true),
        ('pagos.registrar', 'Registrar pagos', 'Registrar nuevos pagos', 'pagos', true),
        ('pagos.admin', 'Administrar pagos', 'Gestión completa de pagos y reembolsos', 'pagos', true),
        ('documentos.subir', 'Subir documentos', 'Cargar archivos al sistema', 'documentos', true),
        ('documentos.validar', 'Validar documentos', 'Aprobar o rechazar documentos', 'documentos', true),
        ('entidades.revisar', 'Revisar en entidades', 'Emitir concepto como entidad revisora', 'entidades', true),
        ('entidades.admin', 'Administrar entidades', 'Gestión del directorio de entidades', 'entidades', true),
        ('catalogos.ver', 'Ver catálogos', 'Consultar datos de referencia', 'catalogos', true),
        ('catalogos.admin', 'Administrar catálogos', 'Gestión completa de catálogos', 'catalogos', true),
        ('perfiles.ver', 'Ver perfiles', 'Consultar perfiles de proveedores', 'perfiles', true),
        ('perfiles.gestionar', 'Gestionar perfil', 'Crear y actualizar perfil propio', 'perfiles', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- MUNICIPIOS DE BOYACÁ ---
    await qr.query(`
      INSERT INTO municipios (nombre, departamento) VALUES
        ('Tunja', 'Boyacá'),
        ('Duitama', 'Boyacá'),
        ('Sogamoso', 'Boyacá'),
        ('Chiquinquirá', 'Boyacá'),
        ('Paipa', 'Boyacá'),
        ('Villa de Leyva', 'Boyacá'),
        ('Samacá', 'Boyacá'),
        ('Moniquirá', 'Boyacá'),
        ('Soatá', 'Boyacá'),
        ('Garagoa', 'Boyacá'),
        ('Aquitania', 'Boyacá'),
        ('Nobsa', 'Boyacá'),
        ('Tibasosa', 'Boyacá'),
        ('Ráquira', 'Boyacá'),
        ('Tenza', 'Boyacá')
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE IDENTIFICACIÓN ---
    await qr.query(`
      INSERT INTO tipos_identificacion (nombre) VALUES
        ('Cédula de ciudadanía'),
        ('Cédula de extranjería'),
        ('Pasaporte'),
        ('Tarjeta de identidad'),
        ('NIT')
      ON CONFLICT DO NOTHING
    `);

    // --- SEXOS AL NACER ---
    await qr.query(`
      INSERT INTO sexos_nacer (nombre) VALUES
        ('Masculino'), ('Femenino'), ('Intersexual'), ('Prefiero no decir')
      ON CONFLICT DO NOTHING
    `);

    // --- IDENTIDADES DE GÉNERO ---
    await qr.query(`
      INSERT INTO identidades_genero (nombre) VALUES
        ('Hombre'), ('Mujer'), ('No binario'), ('Fluido de género'),
        ('Agénero'), ('Bigénero'), ('Transgénero'), ('Travesti'),
        ('Intersexual'), ('Prefiero no decir')
      ON CONFLICT DO NOTHING
    `);

    // --- GRUPOS ÉTNICOS ---
    await qr.query(`
      INSERT INTO grupos_etnicos (nombre) VALUES
        ('Indígena'), ('Afrocolombiano'), ('Raizal'), ('Palenquero'),
        ('Rom o Gitano'), ('Ninguno')
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE DISCAPACIDAD ---
    await qr.query(`
      INSERT INTO tipos_discapacidad (nombre) VALUES
        ('Visual'), ('Auditiva'), ('Física o motriz'),
        ('Mental o psicosocial'), ('Intelectual'), ('Múltiple')
      ON CONFLICT DO NOTHING
    `);

    // --- NIVELES EDUCATIVOS ---
    await qr.query(`
      INSERT INTO niveles_educativos (nombre) VALUES
        ('Primaria'), ('Secundaria'), ('Técnico'), ('Tecnológico'),
        ('Universitario'), ('Especialización'), ('Maestría'), ('Doctorado'),
        ('Sin estudios formales')
      ON CONFLICT DO NOTHING
    `);

    // --- RANGOS DE EXPERIENCIA EN EL SECTOR ---
    await qr.query(`
      INSERT INTO rangos_experiencia_sector (nombre) VALUES
        ('Menos de 1 año'), ('1 a 3 años'), ('3 a 5 años'),
        ('5 a 10 años'), ('Más de 10 años')
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE DEDICACIÓN AL SECTOR ---
    await qr.query(`
      INSERT INTO tiempos_dedicacion_sector (nombre) VALUES
        ('Tiempo completo'), ('Medio tiempo'), ('Por proyectos'), ('Ocasional')
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE INGRESOS DEL SECTOR ---
    await qr.query(`
      INSERT INTO tipos_ingresos_sector (nombre) VALUES
        ('Principal fuente de ingresos'),
        ('Fuente secundaria de ingresos'),
        ('Complemento a otra actividad'),
        ('Sin ingresos del sector aún')
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE PROPIEDAD DE EQUIPOS ---
    await qr.query(`
      INSERT INTO tipos_propiedad_equipos (nombre) VALUES
        ('Propios'), ('Arrendados'), ('Mixto (propios y arrendados)'), ('No tiene equipos propios')
      ON CONFLICT DO NOTHING
    `);

    // --- GAMAS DE EQUIPOS ---
    await qr.query(`
      INSERT INTO gamas_equipos (nombre) VALUES
        ('Gama básica'), ('Gama media'), ('Gama alta'), ('Gama profesional/cine')
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE PRODUCCIÓN EN QUE PARTICIPA ---
    await qr.query(`
      INSERT INTO tipos_produccion_participa (nombre) VALUES
        ('Cine'), ('Televisión'), ('Publicidad'), ('Documental'),
        ('Videoclip'), ('Cortometraje'), ('Serie'), ('Animación'),
        ('Transmedia'), ('Producción digital')
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE PRODUCCIÓN ---
    await qr.query(`
      INSERT INTO tipos_produccion (nombre, descripcion, activo) VALUES
        ('Cine', 'Producción cinematográfica para sala', true),
        ('Televisión', 'Producción para canales de televisión', true),
        ('Publicidad', 'Piezas publicitarias y comerciales', true),
        ('Documental', 'Producción documental', true),
        ('Videoclip', 'Video musical', true),
        ('Cortometraje', 'Producción de corta duración', true),
        ('Serie', 'Serie de televisión o streaming', true),
        ('Animación', 'Producción de animación', true),
        ('Transmedia', 'Producción transmedia e interactiva', true)
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE ENTIDAD ---
    await qr.query(`
      INSERT INTO tipos_entidad (nombre, descripcion, activo) VALUES
        ('Persona Natural', 'Individuo que actúa en nombre propio', true),
        ('Sociedad Comercial', 'S.A.S., S.A., Ltda., etc.', true),
        ('Entidad Sin Ánimo de Lucro', 'Fundaciones, asociaciones, corporaciones', true),
        ('Empresa Industrial y Comercial del Estado', 'Entidades públicas con actividad comercial', true),
        ('Entidad Pública', 'Entidades del orden municipal, departamental o nacional', true)
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE ESPACIO ---
    await qr.query(`
      INSERT INTO tipos_espacio (nombre, descripcion, activo) VALUES
        ('Natural', 'Lagunas, montañas, bosques, páramos', true),
        ('Urbano y exterior', 'Calles, edificios históricos, plazas, fachadas', true),
        ('Interior', 'Casas, oficinas, tiendas, restaurantes', true),
        ('Abandonado', 'Fábricas, estaciones de tren, casas en ruinas', true),
        ('Patrimonial', 'Plazas, parques, edificios, casonas, monumentos', true),
        ('Estudio', 'Espacios con escenarios construidos y control de iluminación y sonido', true)
      ON CONFLICT DO NOTHING
    `);

    // --- ROLES DE EQUIPO TÉCNICO ---
    await qr.query(`
      INSERT INTO roles_equipo_tecnico (nombre, descripcion, activo) VALUES
        ('Director/a', 'Director o directora de la producción audiovisual', true),
        ('Productor/a', 'Productor o productora general del proyecto', true),
        ('Director/a de fotografía', 'Responsable de la fotografía y cámara principal', true),
        ('Operador/a de cámara', 'Operación de cámaras secundarias o de apoyo', true),
        ('Sonidista', 'Responsable de la captura y mezcla de sonido directo', true),
        ('Director/a de arte', 'Responsable del diseño de producción y escenografía', true),
        ('Maquillador/a', 'Maquillaje y caracterización de actores', true),
        ('Vestuarista', 'Diseño y gestión del vestuario de producción', true),
        ('Gaffer', 'Jefe de iluminación eléctrica', true),
        ('Script', 'Continuista o anotador/a de producción', true),
        ('Asistente de dirección', 'Primer o segundo asistente de dirección', true),
        ('Locacionista', 'Búsqueda y gestión de locaciones de rodaje', true),
        ('Coordinador/a de producción', 'Coordinación logística y administrativa del rodaje', true),
        ('Editor/a de video', 'Montaje y edición del material audiovisual', true),
        ('Colorista', 'Corrección de color y etalonaje', true),
        ('Actor/Actriz', 'Intérprete principal o secundario', true),
        ('Extra', 'Figura de fondo o extra en la producción', true),
        ('Piloto de dron', 'Operador certificado de aeronaves no tripuladas', true),
        ('Conductor/a', 'Transporte del equipo técnico y logística', true),
        ('Otro', 'Rol técnico no clasificado en las categorías anteriores', true)
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE TRÁMITE ---
    await qr.query(`
      INSERT INTO tipos_tramite (nombre, descripcion, activo) VALUES
        ('Permiso PUFA Estándar', 'Permiso básico de filmación audiovisual', true),
        ('Permiso PUFA con Drones', 'Incluye autorización de uso de aeronaves no tripuladas', true),
        ('Permiso PUFA con Cierre Vial', 'Requiere plan de manejo de tránsito aprobado', true),
        ('Permiso PUFA Académico', 'Para producciones educativas y estudiantiles con aval institucional', true)
      ON CONFLICT DO NOTHING
    `);

    // --- ESTADOS DE TRÁMITE ---
    await qr.query(`
      INSERT INTO estados_tramite (nombre, descripcion, orden, color_semaforo, activo) VALUES
        ('Recibido', 'Trámite recibido, pendiente de revisión inicial', 1, '#FFA500', true),
        ('En revisión', 'En proceso de revisión por la mesa técnica', 2, '#0000FF', true),
        ('En revisión por entidades', 'Enviado a entidades externas para concepto técnico', 3, '#800080', true),
        ('Aprobado con observaciones', 'Aprobado con condiciones que el solicitante debe cumplir', 4, '#90EE90', true),
        ('Aprobado', 'Permiso de rodaje aprobado — se puede iniciar la producción', 5, '#008000', true),
        ('Rechazado', 'Solicitud rechazada por incumplimiento de requisitos', 6, '#FF0000', true),
        ('Subsanación requerida', 'Se requiere documentación o información adicional', 7, '#FFFF00', true),
        ('Vencido', 'Permiso vencido por inactividad o expiración del plazo', 8, '#808080', true)
      ON CONFLICT DO NOTHING
    `);

    // --- TIPOS DE PAGO ---
    await qr.query(`
      INSERT INTO tipos_pago (codigo, nombre, descripcion, activo) VALUES
        ('abono', 'Abono inicial', 'Pago parcial requerido para iniciar la revisión del trámite', true),
        ('pago_total', 'Pago total', 'Pago completo del trámite', true),
        ('reembolso', 'Reembolso', 'Devolución de pago al solicitante', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- ESTADOS DE PAGO ---
    await qr.query(`
      INSERT INTO estados_pago (codigo, nombre, descripcion, orden, activo) VALUES
        ('pendiente', 'Pendiente de verificación', 'Soporte cargado, pendiente de revisión por el administrador', 1, true),
        ('verificado', 'Verificado', 'Pago confirmado por el administrador', 2, true),
        ('rechazado', 'Rechazado', 'Soporte de pago no válido o insuficiente', 3, true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- ESTADOS DE ABONO ---
    await qr.query(`
      INSERT INTO estados_abono (codigo, nombre, descripcion, orden, activo) VALUES
        ('pendiente', 'Pendiente', 'Abono aún no realizado por el solicitante', 1, true),
        ('pagado', 'Pagado', 'Abono confirmado y verificado', 2, true),
        ('vencido', 'Vencido', 'No se realizó el abono dentro del plazo establecido', 3, true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- TIPOS DE ENTIDAD DE REVISIÓN ---
    await qr.query(`
      INSERT INTO tipos_entidad_revision (codigo, nombre, descripcion, activo) VALUES
        ('municipal', 'Entidad Municipal', 'Alcaldías y entidades del orden municipal', true),
        ('departamental', 'Entidad Departamental', 'Gobernación y secretarías del orden departamental', true),
        ('nacional', 'Entidad Nacional', 'Entidades del orden nacional (Aeronáutica Civil, MinCultura, etc.)', true),
        ('privada', 'Propietario Privado', 'Propietarios privados de locaciones o espacios', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- ESTADOS DE REVISIÓN POR ENTIDAD ---
    await qr.query(`
      INSERT INTO estados_revision_entidad (codigo, nombre, descripcion, orden, color_semaforo, activo) VALUES
        ('pendiente', 'Pendiente', 'Solicitud enviada, sin respuesta aún', 1, '#FFA500', true),
        ('en_revision', 'En revisión', 'La entidad está evaluando la solicitud', 2, '#0000FF', true),
        ('aprobado', 'Aprobado', 'Concepto técnico favorable de la entidad', 3, '#008000', true),
        ('aprobado_condicionado', 'Aprobado con condiciones', 'Aprobado con requisitos o restricciones adicionales', 4, '#90EE90', true),
        ('rechazado', 'Rechazado', 'Concepto desfavorable de la entidad', 5, '#FF0000', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- TIPOS DE DOCUMENTO ---
    // Actualiza los existentes y agrega los faltantes usando nombre como clave natural
    const tiposDocumento = [
      { nombre: 'Cédula de ciudadanía',                     descripcion: 'Documento de identidad del solicitante',                                             aplica_a: 'registro_natural',  obligatorio: true  },
      { nombre: 'RUT',                                       descripcion: 'Registro Único Tributario actualizado',                                              aplica_a: 'registro_juridica', obligatorio: true  },
      { nombre: 'Cámara de comercio',                        descripcion: 'Certificado de existencia y representación legal vigente (no mayor a 90 días)',      aplica_a: 'registro_juridica', obligatorio: true  },
      { nombre: 'Acta de constitución',                      descripcion: 'Copia del acta de constitución de la persona jurídica',                             aplica_a: 'registro_juridica', obligatorio: true  },
      { nombre: 'Acta de nombramiento de representante legal', descripcion: 'Acta vigente de nombramiento del representante legal',                            aplica_a: 'registro_juridica', obligatorio: true  },
      { nombre: 'Carta de intención del proyecto',           descripcion: 'Descripción detallada del proyecto de rodaje',                                      aplica_a: 'tramite',           obligatorio: true  },
      { nombre: 'Plan de contingencia',                      descripcion: 'Plan para el manejo de emergencias durante el rodaje',                               aplica_a: 'tramite',           obligatorio: true  },
      { nombre: 'Soporte de pago',                           descripcion: 'Comprobante del pago o abono realizado',                                            aplica_a: 'pago',              obligatorio: true  },
      { nombre: 'Permiso de Aeronáutica Civil',              descripcion: 'Autorización UAEAC para el uso de drones',                                          aplica_a: 'tramite',           obligatorio: false },
      { nombre: 'Plan de manejo de tránsito',                descripcion: 'Plan aprobado por la autoridad de tránsito competente',                             aplica_a: 'tramite',           obligatorio: false },
      { nombre: 'Consentimiento de comunidades',             descripcion: 'Acta de consentimiento libre, previo e informado de comunidades étnicas',           aplica_a: 'tramite',           obligatorio: false },
      { nombre: 'Póliza de responsabilidad civil',           descripcion: 'Seguro de RC vigente para la producción',                                          aplica_a: 'tramite',           obligatorio: false },
      { nombre: 'Aval institucional',                        descripcion: 'Carta de aval de la institución educativa (para trámites académicos)',              aplica_a: 'tramite',           obligatorio: false },
    ];
    for (const t of tiposDocumento) {
      const existe = await qr.query(
        `SELECT id FROM tipos_documento WHERE nombre = $1 LIMIT 1`,
        [t.nombre],
      );
      if (existe.length > 0) {
        await qr.query(
          `UPDATE tipos_documento SET aplica_a = $1, obligatorio = $2 WHERE nombre = $3`,
          [t.aplica_a, t.obligatorio, t.nombre],
        );
      } else {
        await qr.query(
          `INSERT INTO tipos_documento (nombre, descripcion, aplica_a, obligatorio, activo) VALUES ($1, $2, $3, $4, true)`,
          [t.nombre, t.descripcion, t.aplica_a, t.obligatorio],
        );
      }
    }

    // --- TIPOS DE CONVOCATORIA ---
    await qr.query(`
      INSERT INTO tipos_convocatoria (nombre, descripcion, activo) VALUES
        ('Convocatoria Nacional', 'Convocatorias del Ministerio de Cultura y entidades nacionales', true),
        ('Convocatoria Departamental', 'Convocatorias de la Gobernación de Boyacá', true),
        ('Convocatoria Internacional', 'Convocatorias de fondos y festivales internacionales', true),
        ('Residencia Artística', 'Programas de residencia artística', true),
        ('Coproducción', 'Convocatorias de coproducción nacional o internacional', true)
      ON CONFLICT DO NOTHING
    `);

    // --- CATEGORÍAS DE PROVEEDOR ---
    await qr.query(`
      INSERT INTO categorias_proveedor (codigo, nombre, descripcion, activo) VALUES
        ('service', 'Empresas de Service (Producción y Logística)', 'Realizacion, producción, logística, rental y posproducción', true),
        ('locaciones', 'Locaciones', 'Espacios naturales, urbanos, interiores, patrimoniales y estudios', true),
        ('artisticos_tecnicos', 'Servicios Artísticos y Técnicos', 'Profesionales de cinematografía y producción audiovisual', true),
        ('medios_interactivos', 'Servicios para Medios Interactivos y Transmedia Digital', 'Creadores digitales, desarrolladores y gestores de medios interactivos', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // Obtener IDs de categorías
    const cats = await qr.query(`SELECT id, codigo FROM categorias_proveedor ORDER BY id`);
    const catMap: Record<string, number> = {};
    for (const c of cats) catMap[c.codigo] = parseInt(c.id);

    // --- SUBCATEGORÍAS CATEGORÍA 1: Service ---
    await qr.query(`
      INSERT INTO subcategorias_proveedor (categoria_proveedor_id, codigo, nombre, descripcion, activo) VALUES
        (${catMap['service']}, 'service_realizacion', 'Realización audiovisual', 'Empresas y profesionales de realización', true),
        (${catMap['service']}, 'service_produccion', 'Producción', 'Producción, coproducción y producción de campo', true),
        (${catMap['service']}, 'service_logistica', 'Servicios Logísticos', 'Agencias de viaje, hospedaje, catering, seguridad y transporte', true),
        (${catMap['service']}, 'service_rental', 'Rental', 'Alquiler de equipos, estudios y herramientas', true),
        (${catMap['service']}, 'service_posproduccion', 'Posproducción', 'Doblaje, colorización, mezcla sonora y finalización', true),
        (${catMap['service']}, 'service_scouting', 'Scouting y Desarrollo', 'Búsqueda de locaciones, guion y formulación de proyectos', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- SUBCATEGORÍAS CATEGORÍA 2: Locaciones ---
    await qr.query(`
      INSERT INTO subcategorias_proveedor (categoria_proveedor_id, codigo, nombre, descripcion, activo) VALUES
        (${catMap['locaciones']}, 'loc_natural', 'Natural', 'Lagunas, montañas, bosques, páramos', true),
        (${catMap['locaciones']}, 'loc_urbana', 'Urbanas y exteriores', 'Calles, edificios históricos, plazas, fachadas', true),
        (${catMap['locaciones']}, 'loc_interior', 'Interiores', 'Casas, oficinas, tiendas, restaurantes', true),
        (${catMap['locaciones']}, 'loc_abandonada', 'Abandonadas', 'Fábricas, estaciones de tren, casas en ruinas', true),
        (${catMap['locaciones']}, 'loc_patrimonial', 'Patrimoniales', 'Plazas, parques, edificios, casonas, monumentos declarados patrimonio', true),
        (${catMap['locaciones']}, 'loc_estudio', 'Estudios', 'Espacios con escenarios construidos y control de iluminación y sonido', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- SUBCATEGORÍAS CATEGORÍA 3: Servicios Artísticos y Técnicos ---
    await qr.query(`
      INSERT INTO subcategorias_proveedor (categoria_proveedor_id, codigo, nombre, descripcion, activo) VALUES
        (${catMap['artisticos_tecnicos']}, 'art_direccion', 'Dirección y liderazgo creativo', 'Director/a, asistentes de dirección, script, casting', true),
        (${catMap['artisticos_tecnicos']}, 'art_guion', 'Guion y escritura creativa', 'Guionistas, story editors, adaptadores literarios', true),
        (${catMap['artisticos_tecnicos']}, 'art_fotografia', 'Dirección de fotografía y cámara', 'DFP, operadores de cámara, gaffer, eléctricos', true),
        (${catMap['artisticos_tecnicos']}, 'art_arte', 'Arte y Diseño de Producción', 'Dirección de arte, escenografía, vestuario, maquillaje', true),
        (${catMap['artisticos_tecnicos']}, 'art_sonido', 'Sonido directo', 'Sonidistas, microfonistas, compositores', true),
        (${catMap['artisticos_tecnicos']}, 'art_produccion_at', 'Producción', 'Productores, coordinadores, locacionistas, contabilidad', true),
        (${catMap['artisticos_tecnicos']}, 'art_logistica', 'Logística y transporte', 'Catering, movilidad, transporte de carga y personal', true),
        (${catMap['artisticos_tecnicos']}, 'art_elenco', 'Elenco Actoral', 'Actores, voice actors, dobles de riesgo, extras', true),
        (${catMap['artisticos_tecnicos']}, 'art_postproduccion', 'Posproducción', 'Montajistas, coloristas, editores de sonido', true),
        (${catMap['artisticos_tecnicos']}, 'art_animacion', 'Animación y efectos', 'VFX, animadores 2D/3D, motion graphics', true),
        (${catMap['artisticos_tecnicos']}, 'art_distribucion', 'Distribución y exhibición', 'Distribuidores, agentes de venta, programadores de cine y TV', true),
        (${catMap['artisticos_tecnicos']}, 'art_investigacion', 'Investigación, crítica y educación', 'Investigadores, críticos de cine, docentes, archivistas audiovisuales', true),
        (${catMap['artisticos_tecnicos']}, 'art_emergentes', 'Roles emergentes y plataformas digitales', 'Creadores de contenido digital, streamers, artistas XR', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // --- SUBCATEGORÍAS CATEGORÍA 4: Medios Interactivos ---
    await qr.query(`
      INSERT INTO subcategorias_proveedor (categoria_proveedor_id, codigo, nombre, descripcion, activo) VALUES
        (${catMap['medios_interactivos']}, 'mit_creativos', 'Roles Creativos y Artísticos', 'Artistas digitales, diseñadores multimedia, narradores transmedia', true),
        (${catMap['medios_interactivos']}, 'mit_tecnicos', 'Roles Técnicos y de Desarrollo', 'Desarrolladores de software, ingenieros creativos, especialistas en VR/AR', true),
        (${catMap['medios_interactivos']}, 'mit_curatoriales', 'Roles Curatoriales y de Exhibición', 'Curadores de arte digital, diseñadores de experiencias museográficas', true),
        (${catMap['medios_interactivos']}, 'mit_produccion', 'Roles de Producción y Gestión Cultural Digital', 'Gestores culturales digitales, productores multimedia', true),
        (${catMap['medios_interactivos']}, 'mit_narrativas', 'Roles en Narrativas Emergentes', 'Diseñadores transmedia, guionistas interactivos, artistas NFT', true),
        (${catMap['medios_interactivos']}, 'mit_preservacion', 'Roles en Preservación, Documentación y Difusión Digital', 'Archivistas digitales, gestores de patrimonio digital', true)
      ON CONFLICT (codigo) DO NOTHING
    `);

    // Obtener IDs de subcategorías
    const subcats = await qr.query(`SELECT id, codigo FROM subcategorias_proveedor ORDER BY id`);
    const subMap: Record<string, number> = {};
    for (const s of subcats) subMap[s.codigo] = parseInt(s.id);

    // --- ESPECIALIDADES (roles) por subcategoría ---

    // Service: Realización
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['service_realizacion']}, 'esp_realizacion', 'Realización', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Service: Producción
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['service_produccion']}, 'esp_produccion', 'Producción', true),
      (${subMap['service_produccion']}, 'esp_coproduccion', 'Coproducción', true),
      (${subMap['service_produccion']}, 'esp_prod_campo', 'Producción de campo', true),
      (${subMap['service_produccion']}, 'esp_fx', 'Efectos especiales (FX)', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Service: Logística
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['service_logistica']}, 'esp_agencia_viaje', 'Agencias de viaje', true),
      (${subMap['service_logistica']}, 'esp_hospedaje', 'Hotel y hospedaje', true),
      (${subMap['service_logistica']}, 'esp_catering', 'Restaurantes y servicios de Catering', true),
      (${subMap['service_logistica']}, 'esp_seguridad', 'Seguridad Privada', true),
      (${subMap['service_logistica']}, 'esp_transporte', 'Transporte de Carga y Personal', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Service: Rental
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['service_rental']}, 'esp_equipos_cine', 'Equipos para cinematografía y medios audiovisuales', true),
      (${subMap['service_rental']}, 'esp_estudios_chroma', 'Estudios de grabación y servicio de Chroma', true),
      (${subMap['service_rental']}, 'esp_sonido_eventos', 'Sonido para eventos y tarima', true),
      (${subMap['service_rental']}, 'esp_logistica_prod', 'Logística y producción', true),
      (${subMap['service_rental']}, 'esp_herramientas', 'Herramientas', true),
      (${subMap['service_rental']}, 'esp_instrumentos', 'Instrumentos musicales', true),
      (${subMap['service_rental']}, 'esp_bodega_arte', 'Bodega de arte', true),
      (${subMap['service_rental']}, 'esp_est_musical', 'Estudios de grabación musical y sonido doblaje', true),
      (${subMap['service_rental']}, 'esp_est_foley', 'Estudios de grabación foley', true),
      (${subMap['service_rental']}, 'esp_grab_aerea', 'Grabaciones aéreas', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Service: Posproducción
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['service_posproduccion']}, 'esp_doblaje', 'Doblaje', true),
      (${subMap['service_posproduccion']}, 'esp_traduccion', 'Traducción', true),
      (${subMap['service_posproduccion']}, 'esp_coloracion', 'Colorización', true),
      (${subMap['service_posproduccion']}, 'esp_musica_orig', 'Música original', true),
      (${subMap['service_posproduccion']}, 'esp_mezcla_son', 'Mezcla sonora', true),
      (${subMap['service_posproduccion']}, 'esp_finalizacion', 'Finalización', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Service: Scouting
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['service_scouting']}, 'esp_busq_loc', 'Búsqueda y evaluación de locaciones', true),
      (${subMap['service_scouting']}, 'esp_guion_adapt', 'Guion y adaptación', true),
      (${subMap['service_scouting']}, 'esp_formulacion', 'Formulación de proyectos', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Dirección
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_direccion']}, 'rol_director', 'Director/a', true),
      (${subMap['art_direccion']}, 'rol_primer_ad', 'Primer Asistente de dirección', true),
      (${subMap['art_direccion']}, 'rol_segundo_ad', '2do Asistente de dirección', true),
      (${subMap['art_direccion']}, 'rol_script', 'Script/Continuista', true),
      (${subMap['art_direccion']}, 'rol_coach_act', 'Coach de actores', true),
      (${subMap['art_direccion']}, 'rol_coach_ext', 'Coach de extras', true),
      (${subMap['art_direccion']}, 'rol_dir_cast', 'Director/a de Casting', true),
      (${subMap['art_direccion']}, 'rol_showrunner', 'Showrunner', true),
      (${subMap['art_direccion']}, 'rol_creador_conc', 'Creador/a de contenido o concepto', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Guion
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_guion']}, 'rol_guionista', 'Guionista', true),
      (${subMap['art_guion']}, 'rol_dialoguista', 'Dialoguista', true),
      (${subMap['art_guion']}, 'rol_estructurador', 'Estructurador', true),
      (${subMap['art_guion']}, 'rol_script_doc', 'Script doctor', true),
      (${subMap['art_guion']}, 'rol_adaptador', 'Adaptador/a literario', true),
      (${subMap['art_guion']}, 'rol_story_ed', 'Story editor', true),
      (${subMap['art_guion']}, 'rol_escr_digital', 'Escritor/a para Desarrollo de contenido', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Fotografía
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_fotografia']}, 'rol_dfp', 'Director/a de fotografía', true),
      (${subMap['art_fotografia']}, 'rol_op_cam', 'Operador/a de cámara', true),
      (${subMap['art_fotografia']}, 'rol_foquista', '1er asistente de cámara (foquista)', true),
      (${subMap['art_fotografia']}, 'rol_2do_cam', '2do asistente de cámara', true),
      (${subMap['art_fotografia']}, 'rol_dit', 'DIT', true),
      (${subMap['art_fotografia']}, 'rol_op_dron', 'Operador/a de dron', true),
      (${subMap['art_fotografia']}, 'rol_steadycam', 'Operador/a de steadycam/gimbal', true),
      (${subMap['art_fotografia']}, 'rol_video_ass', 'Asistente de video (playback)', true),
      (${subMap['art_fotografia']}, 'rol_grua_dolly', 'Operador grúa/dolly', true),
      (${subMap['art_fotografia']}, 'rol_gaffer', 'Gaffer', true),
      (${subMap['art_fotografia']}, 'rol_best_boy', 'Best boy electric', true),
      (${subMap['art_fotografia']}, 'rol_electricista', 'Electricista', true),
      (${subMap['art_fotografia']}, 'rol_luminotec', 'Luminotécnico', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Arte
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_arte']}, 'rol_dis_prod', 'Diseñador/a de producción', true),
      (${subMap['art_arte']}, 'rol_dir_arte', 'Director/a de arte', true),
      (${subMap['art_arte']}, 'rol_escenografo', 'Escenógrafo/a', true),
      (${subMap['art_arte']}, 'rol_ambientador', 'Ambientador/a', true),
      (${subMap['art_arte']}, 'rol_utilero', 'Utilero/a', true),
      (${subMap['art_arte']}, 'rol_asist_arte', 'Asistente de arte', true),
      (${subMap['art_arte']}, 'rol_maquetista', 'Maquetista', true),
      (${subMap['art_arte']}, 'rol_carpintero', 'Carpintero/a de arte', true),
      (${subMap['art_arte']}, 'rol_pintor', 'Pintor/a de escenografía', true),
      (${subMap['art_arte']}, 'rol_dis_vest', 'Diseñador/a de vestuario', true),
      (${subMap['art_arte']}, 'rol_vestuarista', 'Vestuarista/sastre', true),
      (${subMap['art_arte']}, 'rol_guarda_ropa', 'Encargado/a de guardarropa', true),
      (${subMap['art_arte']}, 'rol_maquillador', 'Maquillador/a', true),
      (${subMap['art_arte']}, 'rol_maquillador_fx', 'Maquillador/a FX', true),
      (${subMap['art_arte']}, 'rol_peluquero', 'Peinador/a o peluquero/a', true),
      (${subMap['art_arte']}, 'rol_asist_maq', 'Asistente de maquillaje y peinado', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Sonido directo
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_sonido']}, 'rol_sonidista', 'Sonidista/Ingeniero/a de sonido directo', true),
      (${subMap['art_sonido']}, 'rol_dis_sonoro', 'Diseñador/a sonoro', true),
      (${subMap['art_sonido']}, 'rol_microfonista', 'Microfonista', true),
      (${subMap['art_sonido']}, 'rol_asist_son', 'Asistente de sonido', true),
      (${subMap['art_sonido']}, 'rol_sup_son', 'Supervisor/a de sonido', true),
      (${subMap['art_sonido']}, 'rol_compositor', 'Compositor/a de música para cine y/o audiovisuales', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Producción (dentro de cat 3)
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_produccion_at']}, 'rol_prod_gral', 'Productor/a general', true),
      (${subMap['art_produccion_at']}, 'rol_prod_ejec', 'Productor/a ejecutivo', true),
      (${subMap['art_produccion_at']}, 'rol_line_prod', 'Line Producer', true),
      (${subMap['art_produccion_at']}, 'rol_prod_campo', 'Productor/a de campo', true),
      (${subMap['art_produccion_at']}, 'rol_asist_prod', 'Asistente de producción', true),
      (${subMap['art_produccion_at']}, 'rol_coord_prod', 'Coordinador/a de producción', true),
      (${subMap['art_produccion_at']}, 'rol_sup_prod', 'Supervisor/a de producción', true),
      (${subMap['art_produccion_at']}, 'rol_locacionista', 'Locacionista', true),
      (${subMap['art_produccion_at']}, 'rol_asesor_leg', 'Asesor legal', true),
      (${subMap['art_produccion_at']}, 'rol_contador', 'Contador/a', true),
      (${subMap['art_produccion_at']}, 'rol_aux_adm', 'Auxiliar administrativo/a', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Logística
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_logistica']}, 'rol_enc_catering', 'Encargado/a de catering', true),
      (${subMap['art_logistica']}, 'rol_enc_aloj', 'Encargado/a de alojamiento', true),
      (${subMap['art_logistica']}, 'rol_enc_movil', 'Encargado/a de movilidad técnica', true),
      (${subMap['art_logistica']}, 'rol_jefe_transp', 'Jefe/a de transporte', true),
      (${subMap['art_logistica']}, 'rol_conductor', 'Conductor', true),
      (${subMap['art_logistica']}, 'rol_aux_log', 'Auxiliar logístico', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Elenco
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_elenco']}, 'rol_actor', 'Actor/actriz', true),
      (${subMap['art_elenco']}, 'rol_voice_actor', 'Actor/actriz de voz (voice actor)', true),
      (${subMap['art_elenco']}, 'rol_stunt', 'Dobles de riesgo (stunt)', true),
      (${subMap['art_elenco']}, 'rol_doblador', 'Doblador/a', true),
      (${subMap['art_elenco']}, 'rol_extra', 'Figurante/extra', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Posproducción
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_postproduccion']}, 'rol_montajista', 'Montajista', true),
      (${subMap['art_postproduccion']}, 'rol_editor_vid', 'Editor/a de video', true),
      (${subMap['art_postproduccion']}, 'rol_sup_post', 'Supervisor/a de postproducción', true),
      (${subMap['art_postproduccion']}, 'rol_colorista', 'Corrección de color digital (Etalonador)', true),
      (${subMap['art_postproduccion']}, 'rol_asist_ed', 'Asistente de edición', true),
      (${subMap['art_postproduccion']}, 'rol_mezclador', 'Mezcla Sonora', true),
      (${subMap['art_postproduccion']}, 'rol_ed_son', 'Editor/a de sonido', true),
      (${subMap['art_postproduccion']}, 'rol_amb_son', 'Ambientador/a sonoro', true),
      (${subMap['art_postproduccion']}, 'rol_foley', 'Foley artista', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Animación y VFX
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_animacion']}, 'rol_coord_vfx', 'Coordinador/a de VFX', true),
      (${subMap['art_animacion']}, 'rol_sup_vfx', 'Supervisor/a de VFX', true),
      (${subMap['art_animacion']}, 'rol_artista_vfx', 'Artista de VFX', true),
      (${subMap['art_animacion']}, 'rol_animador', 'Animador/a 2D/3D', true),
      (${subMap['art_animacion']}, 'rol_modelador', 'Modelador/a 3D', true),
      (${subMap['art_animacion']}, 'rol_rigger', 'Rigger', true),
      (${subMap['art_animacion']}, 'rol_motion', 'Motion graphics designer', true),
      (${subMap['art_animacion']}, 'rol_comp_dig', 'Compositor/a digital', true),
      (${subMap['art_animacion']}, 'rol_dis_titulos', 'Diseñador/a de títulos y créditos', true),
      (${subMap['art_animacion']}, 'rol_cgi', 'Especialista en CGI', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Distribución
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_distribucion']}, 'rol_distribuidor', 'Distribuidor/a', true),
      (${subMap['art_distribucion']}, 'rol_agente_vent', 'Agente de ventas', true),
      (${subMap['art_distribucion']}, 'rol_enc_fest', 'Encargado/a de festivales', true),
      (${subMap['art_distribucion']}, 'rol_prog_cine', 'Programador/a de cine o TV', true),
      (${subMap['art_distribucion']}, 'rol_curador_av', 'Curador/a audiovisual', true),
      (${subMap['art_distribucion']}, 'rol_dis_trailers', 'Diseñador/a de trailers', true),
      (${subMap['art_distribucion']}, 'rol_cm_av', 'Community manager audiovisual', true),
      (${subMap['art_distribucion']}, 'rol_mkt_cine', 'Especialista en marketing cinematográfico', true),
      (${subMap['art_distribucion']}, 'rol_analista_aud', 'Analista de audiencias', true),
      (${subMap['art_distribucion']}, 'rol_dis_campana', 'Diseñador/a de campañas de lanzamiento', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Investigación
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_investigacion']}, 'rol_investigador', 'Investigador/a de cine', true),
      (${subMap['art_investigacion']}, 'rol_teorico', 'Teórico/a del audiovisual', true),
      (${subMap['art_investigacion']}, 'rol_critico', 'Crítico/a de cine', true),
      (${subMap['art_investigacion']}, 'rol_docente_av', 'Docente de medios audiovisuales', true),
      (${subMap['art_investigacion']}, 'rol_consultor_aud', 'Consultor/a de guion o dirección', true),
      (${subMap['art_investigacion']}, 'rol_archivista', 'Archivista audiovisual', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Artísticos: Emergentes
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['art_emergentes']}, 'rol_creador_plat', 'Creador/a de contenido para plataformas (YouTube/TikTok/Twitch)', true),
      (${subMap['art_emergentes']}, 'rol_podcaster', 'Podcaster audiovisual', true),
      (${subMap['art_emergentes']}, 'rol_streamer', 'Streamer/presentador/a digital', true),
      (${subMap['art_emergentes']}, 'rol_vr_ar_dis', 'Diseñador/a de experiencias VR/AR', true),
      (${subMap['art_emergentes']}, 'rol_narr_int', 'Narrador/a interactivo', true),
      (${subMap['art_emergentes']}, 'rol_art_av_exp', 'Artista audiovisual experimental', true),
      (${subMap['art_emergentes']}, 'rol_int_narrat', 'Diseñador/a de interfaces narrativas', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Transmedia: Creativos
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['mit_creativos']}, 'rol_art_digital', 'Artista digital/multimedia', true),
      (${subMap['mit_creativos']}, 'rol_art_interac', 'Artista de medios interactivos', true),
      (${subMap['mit_creativos']}, 'rol_dev_app_art', 'Desarrollador/a de aplicaciones artísticas', true),
      (${subMap['mit_creativos']}, 'rol_integr_tec', 'Integrador/a de tecnologías', true),
      (${subMap['mit_creativos']}, 'rol_ai_art', 'Artista generativo (AI art)', true),
      (${subMap['mit_creativos']}, 'rol_dis_exp_int', 'Diseñador/a de experiencia interactiva', true),
      (${subMap['mit_creativos']}, 'rol_narr_trans', 'Narrador/a transmedia', true),
      (${subMap['mit_creativos']}, 'rol_dev_vj_art', 'Desarrollador/a de videojuegos artísticos', true),
      (${subMap['mit_creativos']}, 'rol_art_inmersivo', 'Creador/a de arte inmersivo (VR/AR/MR)', true),
      (${subMap['mit_creativos']}, 'rol_prog_creativo', 'Programador/a creativo/a', true),
      (${subMap['mit_creativos']}, 'rol_artista_datos', 'Artista de datos', true),
      (${subMap['mit_creativos']}, 'rol_xr_artist', 'Artista de realidad extendida (XR)', true),
      (${subMap['mit_creativos']}, 'rol_mundos_virt', 'Creador/a de mundos virtuales', true),
      (${subMap['mit_creativos']}, 'rol_filtros_rr', 'Creador/a de filtros y efectos en redes sociales', true),
      (${subMap['mit_creativos']}, 'rol_escr_digital', 'Escritor/a para medios digitales', true),
      (${subMap['mit_creativos']}, 'rol_ia_creativa', 'Diseñador/a de inteligencia artificial creativa', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Transmedia: Técnicos
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['mit_tecnicos']}, 'rol_dev_sw_int', 'Desarrollador/a de software interactivo', true),
      (${subMap['mit_tecnicos']}, 'rol_dev_web_art', 'Desarrollador/a web para proyectos artísticos', true),
      (${subMap['mit_tecnicos']}, 'rol_ing_creativo', 'Ingeniero/a creativo/a', true),
      (${subMap['mit_tecnicos']}, 'rol_game_design', 'Desarrollador/a de videojuegos/game designer', true),
      (${subMap['mit_tecnicos']}, 'rol_dev_3d', 'Desarrollador/a de entornos 3D', true),
      (${subMap['mit_tecnicos']}, 'rol_dev_inmers', 'Programador/a para experiencias inmersivas (VR/AR/MR)', true),
      (${subMap['mit_tecnicos']}, 'rol_ia_arte', 'Desarrollador/a de IA aplicada al arte', true),
      (${subMap['mit_tecnicos']}, 'rol_ixd', 'Diseñador/a de interacción (IxD)', true),
      (${subMap['mit_tecnicos']}, 'rol_ui_dis', 'Diseñador/a de interfaz (UI)', true),
      (${subMap['mit_tecnicos']}, 'rol_ux_dev', 'Desarrollador/a de experiencia de usuario (UX)', true),
      (${subMap['mit_tecnicos']}, 'rol_esp_ar', 'Especialista en AR', true),
      (${subMap['mit_tecnicos']}, 'rol_esp_vr', 'Especialista en VR', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Transmedia: Curatoriales
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['mit_curatoriales']}, 'rol_cur_art_dig', 'Curador/a de arte digital', true),
      (${subMap['mit_curatoriales']}, 'rol_prod_exp_dig', 'Productor/a de exposiciones digitales o híbridas', true),
      (${subMap['mit_curatoriales']}, 'rol_dis_museal', 'Diseñador/a de experiencias museográficas interactivas', true),
      (${subMap['mit_curatoriales']}, 'rol_esp_iface', 'Especialista en interfaces museales', true),
      (${subMap['mit_curatoriales']}, 'rol_gest_plat', 'Gestor/a de plataformas de arte digital', true),
      (${subMap['mit_curatoriales']}, 'rol_dis_inmers', 'Diseñador/a de entornos expositivos inmersivos', true),
      (${subMap['mit_curatoriales']}, 'rol_enc_vj', 'Encargado/a de exhibiciones de videojuegos o arte inmersivo', true),
      (${subMap['mit_curatoriales']}, 'rol_acc_dig', 'Asesor/a en accesibilidad digital', true),
      (${subMap['mit_curatoriales']}, 'rol_rec_virt', 'Desarrollador/a de recorridos virtuales y metaversos artísticos', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Transmedia: Producción cultural digital
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['mit_produccion']}, 'rol_gest_cult_dig', 'Gestor/a cultural digital', true),
      (${subMap['mit_produccion']}, 'rol_prod_mult', 'Productor/a multimedia/digital', true),
      (${subMap['mit_produccion']}, 'rol_coord_art_tec', 'Coordinador/a de proyectos de arte y tecnología', true),
      (${subMap['mit_produccion']}, 'rol_ases_conv', 'Asesor/a de proyectos digitales en convocatorias culturales', true),
      (${subMap['mit_produccion']}, 'rol_manager_dig', 'Manager o representante de artistas digitales', true),
      (${subMap['mit_produccion']}, 'rol_coord_fest', 'Coordinador/a de festivales de medios interactivos', true),
      (${subMap['mit_produccion']}, 'rol_cur_prog', 'Curador/a de programación en festivales', true),
      (${subMap['mit_produccion']}, 'rol_strat_rrsoc', 'Estratega de redes sociales para artistas digitales', true),
      (${subMap['mit_produccion']}, 'rol_coord_hack', 'Coordinador/a de hackatones y laboratorios digitales', true),
      (${subMap['mit_produccion']}, 'rol_prod_virt', 'Productor/a de eventos en entornos virtuales', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Transmedia: Narrativas emergentes
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['mit_narrativas']}, 'rol_dis_trans', 'Diseñador/a de narrativas transmedia', true),
      (${subMap['mit_narrativas']}, 'rol_guion_int', 'Guionista interactivo/a', true),
      (${subMap['mit_narrativas']}, 'rol_narr_xr', 'Narrador/a de mundos XR', true),
      (${subMap['mit_narrativas']}, 'rol_dis_spec', 'Diseñador/a de ficciones especulativas', true),
      (${subMap['mit_narrativas']}, 'rol_story_inm', 'Diseñador/a de storytelling inmersivo', true),
      (${subMap['mit_narrativas']}, 'rol_nft_art', 'Creador/a de arte NFT y blockchain art', true),
      (${subMap['mit_narrativas']}, 'rol_ia_narr', 'Desarrollador/a de obras en IA narrativa', true),
      (${subMap['mit_narrativas']}, 'rol_bot_fic', 'Escritor/a para bots y ficción procedural', true),
      (${subMap['mit_narrativas']}, 'rol_glitch', 'Artista de redes sociales (glitch art, performance digital)', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // Transmedia: Preservación y difusión
    await qr.query(`INSERT INTO especialidades_proveedor (subcategoria_proveedor_id, codigo, nombre, activo) VALUES
      (${subMap['mit_preservacion']}, 'rol_acc_dig_2', 'Encargado/a de accesibilidad digital', true),
      (${subMap['mit_preservacion']}, 'rol_archiv_dig', 'Archivista digital de medios interactivos', true),
      (${subMap['mit_preservacion']}, 'rol_pres_art', 'Especialista en preservación de arte digital', true),
      (${subMap['mit_preservacion']}, 'rol_docum_mult', 'Documentalista de procesos multimedia', true),
      (${subMap['mit_preservacion']}, 'rol_catalog', 'Encargado/a de digitalización y catalogación artística', true),
      (${subMap['mit_preservacion']}, 'rol_difusor', 'Difusor/a de prácticas artísticas en plataformas digitales', true),
      (${subMap['mit_preservacion']}, 'rol_gest_pat', 'Gestor/a de patrimonio digital artístico', true),
      (${subMap['mit_preservacion']}, 'rol_repo_web', 'Desarrollador/a de repositorios web interactivos', true)
      ON CONFLICT (codigo) DO NOTHING`);

    // --- USUARIO ADMINISTRADOR INICIAL ---
    const passwordHash = await bcrypt.hash('Admin2024!', 10);
    const [estadoActivo] = await qr.query(`SELECT id FROM estados_cuenta WHERE codigo = 'activo' LIMIT 1`);
    const [tipoPerfAdmin] = await qr.query(`SELECT id FROM tipos_perfil WHERE codigo = 'admin' LIMIT 1`);

    await qr.query(`
      INSERT INTO usuarios (tipo_persona, email, telefono, password_hash, estado_cuenta_id, tipo_perfil_id, activo)
      VALUES ('natural', 'admin@pufa.gov.co', '3001234567', '${passwordHash}', ${estadoActivo.id}, ${tipoPerfAdmin.id}, true)
      ON CONFLICT (email) DO NOTHING
    `);

    const [adminUser] = await qr.query(`SELECT id FROM usuarios WHERE email = 'admin@pufa.gov.co' LIMIT 1`);
    const [rolAdmin] = await qr.query(`SELECT id FROM roles WHERE codigo = 'admin' LIMIT 1`);

    if (adminUser && rolAdmin) {
      // Asigna rol admin al usuario inicial
      await qr.query(`
        INSERT INTO usuario_roles (usuario_id, rol_id, activo)
        VALUES (${adminUser.id}, ${rolAdmin.id}, true)
        ON CONFLICT DO NOTHING
      `);

      // Asigna todos los permisos al rol admin
      await qr.query(`
        INSERT INTO rol_permisos (rol_id, permiso_id, activo)
        SELECT ${rolAdmin.id}, id, true FROM permisos
        ON CONFLICT DO NOTHING
      `);
    }

    // --- PERMISOS POR ROL ---

    // Productora: crear y gestionar sus propios trámites, pagos y documentos
    await qr.query(`
      INSERT INTO rol_permisos (rol_id, permiso_id, activo)
      SELECT r.id, p.id, true
      FROM roles r, permisos p
      WHERE r.codigo = 'productora'
        AND p.codigo IN (
          'tramites.ver', 'tramites.crear', 'tramites.editar',
          'pagos.ver', 'pagos.registrar',
          'documentos.subir',
          'catalogos.ver',
          'perfiles.ver', 'perfiles.gestionar'
        )
      ON CONFLICT DO NOTHING
    `);

    // Proveedor: gestionar su propio perfil y consultar catálogos
    await qr.query(`
      INSERT INTO rol_permisos (rol_id, permiso_id, activo)
      SELECT r.id, p.id, true
      FROM roles r, permisos p
      WHERE r.codigo = 'proveedor'
        AND p.codigo IN (
          'catalogos.ver',
          'perfiles.ver', 'perfiles.gestionar'
        )
      ON CONFLICT DO NOTHING
    `);

    // Académico: acceso de consulta a trámites y catálogos
    await qr.query(`
      INSERT INTO rol_permisos (rol_id, permiso_id, activo)
      SELECT r.id, p.id, true
      FROM roles r, permisos p
      WHERE r.codigo = 'academico'
        AND p.codigo IN (
          'tramites.ver',
          'catalogos.ver',
          'perfiles.ver'
        )
      ON CONFLICT DO NOTHING
    `);

    // Revisor: revisar y aprobar trámites asignados por entidades externas
    await qr.query(`
      INSERT INTO rol_permisos (rol_id, permiso_id, activo)
      SELECT r.id, p.id, true
      FROM roles r, permisos p
      WHERE r.codigo = 'revisor'
        AND p.codigo IN (
          'tramites.ver', 'tramites.aprobar', 'tramites.rechazar',
          'documentos.validar',
          'entidades.revisar',
          'catalogos.ver',
          'usuarios.ver'
        )
      ON CONFLICT DO NOTHING
    `);

    await qr.commitTransaction();
    console.log('Seed completado exitosamente para PUFA-Backend');
    console.log('Admin inicial: admin@pufa.gov.co / Admin2024!');

  } catch (error) {
    await qr.rollbackTransaction();
    console.error('Error en el seed:', error);
    throw error;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seed();
