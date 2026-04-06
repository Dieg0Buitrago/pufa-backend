import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudRegistro } from './entities/solicitud-registro.entity';
import { HistorialSolicitudRegistro } from './entities/historial-solicitud-registro.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { Rol } from '../auth/entities/rol.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';
import { PersonaNatural } from '../usuarios/entities/persona-natural.entity';
import { PersonaJuridica } from '../usuarios/entities/persona-juridica.entity';
import { PerfilProductora } from '../perfiles/entities/perfil-productora.entity';
import { PerfilProveedor } from '../perfiles/entities/perfil-proveedor.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { TipoDocumento } from '../catalogos/entities/tipo-documento.entity';

// Mapeo de tipo de perfil al código de rol correspondiente
const PERFIL_ROL_MAP: Record<string, string> = {
  productora: 'productora',
  proveedor: 'proveedor',
  academico: 'academico',
  revisor: 'revisor',
};

@Injectable()
export class RegistroService {
  constructor(
    @InjectRepository(SolicitudRegistro)
    private solicitudesRepo: Repository<SolicitudRegistro>,
    @InjectRepository(HistorialSolicitudRegistro)
    private historialRepo: Repository<HistorialSolicitudRegistro>,
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    @InjectRepository(EstadoCuenta)
    private estadosCuentaRepo: Repository<EstadoCuenta>,
    @InjectRepository(Rol)
    private rolesRepo: Repository<Rol>,
    @InjectRepository(UsuarioRol)
    private usuarioRolesRepo: Repository<UsuarioRol>,
    @InjectRepository(PersonaNatural)
    private personasNaturalesRepo: Repository<PersonaNatural>,
    @InjectRepository(PersonaJuridica)
    private personasJuridicasRepo: Repository<PersonaJuridica>,
    @InjectRepository(PerfilProductora)
    private perfilesProductoraRepo: Repository<PerfilProductora>,
    @InjectRepository(PerfilProveedor)
    private perfilesProveedorRepo: Repository<PerfilProveedor>,
    @InjectRepository(Documento)
    private documentosRepo: Repository<Documento>,
    @InjectRepository(TipoDocumento)
    private tiposDocumentoRepo: Repository<TipoDocumento>,
  ) {}

  // Crea o reactiva la solicitud de registro para el usuario autenticado
  async crearSolicitud(usuarioId: number) {
    // Si ya tiene una solicitud pendiente, no puede crear otra
    const pendiente = await this.solicitudesRepo.findOne({
      where: { usuario_id: usuarioId, estado_solicitud: 'pendiente' },
    });
    if (pendiente) {
      throw new BadRequestException('Ya tiene una solicitud de registro pendiente');
    }

    // Si tiene una solicitud en subsanación, la reactiva a pendiente
    const enSubsanacion = await this.solicitudesRepo.findOne({
      where: { usuario_id: usuarioId, estado_solicitud: 'subsanacion' },
    });
    if (enSubsanacion) {
      const estadoAnterior = enSubsanacion.estado_solicitud;
      enSubsanacion.estado_solicitud = 'pendiente';
      enSubsanacion.fecha_envio = new Date();
      await this.solicitudesRepo.save(enSubsanacion);

      await this.registrarHistorial(
        enSubsanacion.id, estadoAnterior, 'pendiente', usuarioId,
        'REENVIO_SOLICITUD', 'Usuario corrigió la información y reenvió la solicitud',
      );

      return { mensaje: 'Solicitud reenviada exitosamente. El administrador la revisará nuevamente.' };
    }

    // Si no existe ninguna, crea una nueva
    const solicitud = this.solicitudesRepo.create({
      usuario_id: usuarioId,
      estado_solicitud: 'pendiente',
    });
    const guardada = await this.solicitudesRepo.save(solicitud);

    await this.registrarHistorial(
      guardada.id, undefined, 'pendiente', usuarioId, 'ENVIO_SOLICITUD', 'Solicitud enviada por el usuario',
    );

    return guardada;
  }

  // Lista solicitudes pendientes para revisión del admin
  async listar(page = 1, limit = 20, estado?: string) {
    const where = estado ? { estado_solicitud: estado } : {};
    const [data, total] = await this.solicitudesRepo.findAndCount({
      where,
      relations: ['usuario'],
      skip: (page - 1) * limit,
      take: limit,
      order: { fecha_envio: 'DESC' },
    });
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // Admin revisa y aprueba o rechaza una solicitud
  async revisarSolicitud(
    solicitudId: number,
    adminId: number,
    nuevoEstado: 'aprobado' | 'rechazado' | 'subsanacion',
    observaciones: string,
  ) {
    const solicitud = await this.solicitudesRepo.findOne({
      where: { id: solicitudId },
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    const estadoAnterior = solicitud.estado_solicitud;

    // Si es persona jurídica, verifica documentos ANTES de modificar nada
    if (nuevoEstado === 'aprobado') {
      const usuario = await this.usuariosRepo.findOne({
        where: { id: solicitud.usuario_id },
        relations: ['tipo_perfil'],
      });

      if (usuario?.tipo_persona === 'juridica') {
        // Verifica que todos los documentos obligatorios de registro fueron subidos
        const tiposObligatorios = await this.tiposDocumentoRepo.find({
          where: { aplica_a: 'registro_juridica', obligatorio: true, activo: true },
        });

        const documentosSubidos = await this.documentosRepo.find({
          where: { solicitud_registro_id: solicitudId, activo: true },
        });

        const tiposSubidos = new Set(documentosSubidos.map((d) => d.tipo_documento_id));
        const faltantes = tiposObligatorios.filter((t) => !tiposSubidos.has(t.id));

        if (faltantes.length > 0) {
          const nombres = faltantes.map((t) => t.nombre).join(', ');
          throw new BadRequestException(
            `Faltan documentos obligatorios por subir: ${nombres}.`,
          );
        }

        const pendientes = documentosSubidos.filter((d) => d.estado_validacion === 'pendiente');
        const rechazados = documentosSubidos.filter((d) => d.estado_validacion === 'rechazado');

        if (pendientes.length > 0) {
          throw new BadRequestException(
            `No se puede aprobar. Hay ${pendientes.length} documento(s) pendiente(s) de validación.`,
          );
        }

        if (rechazados.length > 0) {
          throw new BadRequestException(
            `No se puede aprobar. Hay ${rechazados.length} documento(s) rechazado(s). El usuario debe corregirlos.`,
          );
        }
      }
    }

    // Validaciones pasadas — ahora sí se guarda el nuevo estado
    solicitud.estado_solicitud = nuevoEstado;
    solicitud.admin_revisor_id = adminId;
    solicitud.observaciones_admin = observaciones;
    solicitud.fecha_revision = new Date();
    solicitud.fecha_respuesta = new Date();

    if (nuevoEstado === 'subsanacion') {
      solicitud.numero_subsanaciones += 1;
    }

    await this.solicitudesRepo.save(solicitud);

    // Si se aprueba, activa la cuenta y asigna el rol según el tipo de perfil
    if (nuevoEstado === 'aprobado') {
      const estadoActivo = await this.estadosCuentaRepo.findOne({ where: { codigo: 'activo' } });
      if (estadoActivo) {
        await this.usuariosRepo.update(solicitud.usuario_id, {
          estado_cuenta_id: estadoActivo.id,
          fecha_aprobacion: new Date(),
        });
      }

      // Asigna el rol correspondiente al tipo de perfil del usuario
      const usuario = await this.usuariosRepo.findOne({
        where: { id: solicitud.usuario_id },
        relations: ['tipo_perfil'],
      });
      const codigoRol = PERFIL_ROL_MAP[usuario?.tipo_perfil?.codigo ?? ''];
      if (codigoRol) {
        const rol = await this.rolesRepo.findOne({ where: { codigo: codigoRol, activo: true } });
        if (rol) {
          const yaAsignado = await this.usuarioRolesRepo.findOne({
            where: { usuario_id: solicitud.usuario_id, rol_id: rol.id },
          });
          if (!yaAsignado) {
            await this.usuarioRolesRepo.save(
              this.usuarioRolesRepo.create({
                usuario_id: solicitud.usuario_id,
                rol_id: rol.id,
                asignado_por: adminId,
                activo: true,
              }),
            );
          }
        }
      }

      // Auto-crea el perfil según el tipo de perfil del usuario
      if (usuario?.tipo_perfil?.codigo === 'productora') {
        await this.autoCrearPerfilProductora(solicitud.usuario_id, usuario.tipo_persona);
      } else if (usuario?.tipo_perfil?.codigo === 'proveedor') {
        await this.autoCrearPerfilProveedor(solicitud.usuario_id);
      }
    }

    await this.registrarHistorial(
      solicitudId, estadoAnterior, nuevoEstado, adminId,
      `REVISION_${nuevoEstado.toUpperCase()}`, observaciones,
    );

    return { mensaje: `Solicitud actualizada a estado: ${nuevoEstado}` };
  }

  // Crea automáticamente el perfil de productora al aprobar la cuenta
  private async autoCrearPerfilProductora(usuarioId: number, tipoPersona: string) {
    const existe = await this.perfilesProductoraRepo.findOne({ where: { usuario_id: usuarioId } });
    if (existe) return;

    let datos: Partial<PerfilProductora> = {};

    if (tipoPersona === 'natural') {
      const persona = await this.personasNaturalesRepo.findOne({ where: { usuario_id: usuarioId } });
      if (persona) {
        const partes = [persona.primer_nombre, persona.segundo_nombre, persona.primer_apellido, persona.segundo_apellido];
        datos = {
          primer_nombre: persona.primer_nombre,
          segundo_nombre: persona.segundo_nombre,
          primer_apellido: persona.primer_apellido,
          segundo_apellido: persona.segundo_apellido,
          tipo_identificacion_id: persona.tipo_identificacion_id,
          numero_documento: persona.numero_documento,
          municipio_id: persona.municipio_residencia_id,
          nombre_publico: partes.filter(Boolean).join(' '),
        };
      }
    } else if (tipoPersona === 'juridica') {
      const persona = await this.personasJuridicasRepo.findOne({ where: { usuario_id: usuarioId } });
      if (persona) {
        datos = {
          nombre_publico: persona.razon_social,
          descripcion_empresa: persona.objeto_social,
          sitio_web: persona.pagina_web,
        };
      }
    }

    await this.perfilesProductoraRepo.save(
      this.perfilesProductoraRepo.create({ usuario_id: usuarioId, ...datos }),
    );
  }

  // Crea automáticamente el perfil de proveedor al aprobar la cuenta con verificado = true
  private async autoCrearPerfilProveedor(usuarioId: number) {
    const existe = await this.perfilesProveedorRepo.findOne({ where: { usuario_id: usuarioId } });
    if (existe) {
      await this.perfilesProveedorRepo.update(existe.id, { verificado: true });
      return;
    }
    await this.perfilesProveedorRepo.save(
      this.perfilesProveedorRepo.create({ usuario_id: usuarioId, verificado: true, visible_directorio: true }),
    );
  }

  // Registra cada cambio de estado en el historial
  private async registrarHistorial(
    solicitudId: number,
    estadoAnterior: string | undefined,
    estadoNuevo: string,
    usuarioActorId: number,
    accion: string,
    observacion: string,
  ) {
    const entrada = this.historialRepo.create({
      solicitud_registro_id: solicitudId,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      usuario_actor_id: usuarioActorId,
      accion,
      observacion,
    });
    await this.historialRepo.save(entrada);
  }
}
