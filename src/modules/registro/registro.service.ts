import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SolicitudRegistro } from './entities/solicitud-registro.entity';
import { HistorialSolicitudRegistro } from './entities/historial-solicitud-registro.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { Rol } from '../auth/entities/rol.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';
import { TipoPerfil } from '../catalogos/entities/tipo-perfil.entity';
import { PersonaNatural } from '../usuarios/entities/persona-natural.entity';
import { PersonaJuridica } from '../usuarios/entities/persona-juridica.entity';
import { SubsanarRegistroDto } from './dto/subsanar-registro.dto';
import { PerfilProductora } from '../perfiles/entities/perfil-productora.entity';
import { PerfilProveedor } from '../perfiles/entities/perfil-proveedor.entity';
import { PerfilAcademico } from '../perfiles/entities/perfil-academico.entity';
import { SubcategoriaProveedor } from '../perfiles/entities/subcategoria-proveedor.entity';
import { EspecialidadProveedor } from '../perfiles/entities/especialidad-proveedor.entity';

// Mapeo entre código de tipo de perfil y código de rol a asignar
const ROL_POR_PERFIL: Record<string, string> = {
  productora: 'productora',
  proveedor: 'proveedor',
  academico: 'academico',
  admin: 'admin',
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
    @InjectRepository(TipoPerfil)
    private tiposPerfilRepo: Repository<TipoPerfil>,
    @InjectRepository(PersonaNatural)
    private personasNaturalesRepo: Repository<PersonaNatural>,
    @InjectRepository(PersonaJuridica)
    private personasJuridicasRepo: Repository<PersonaJuridica>,
    @InjectRepository(PerfilProductora)
    private perfilesProductoraRepo: Repository<PerfilProductora>,
    @InjectRepository(PerfilProveedor)
    private perfilesProveedorRepo: Repository<PerfilProveedor>,
    @InjectRepository(PerfilAcademico)
    private perfilesAcademicoRepo: Repository<PerfilAcademico>,
    @InjectRepository(SubcategoriaProveedor)
    private subcategoriasRepo: Repository<SubcategoriaProveedor>,
    @InjectRepository(EspecialidadProveedor)
    private especialidadesRepo: Repository<EspecialidadProveedor>,
  ) {}

  // Crea solicitud de registro para el usuario autenticado
  async crearSolicitud(usuarioId: number) {
    const existente = await this.solicitudesRepo.findOne({
      where: { usuario_id: usuarioId, estado_solicitud: 'pendiente' },
    });
    if (existente) {
      throw new BadRequestException('Ya tiene una solicitud de registro pendiente');
    }

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
    solicitud.estado_solicitud = nuevoEstado;
    solicitud.admin_revisor_id = adminId;
    solicitud.observaciones_admin = observaciones;
    solicitud.fecha_respuesta = new Date();

    if (nuevoEstado === 'subsanacion') {
      solicitud.numero_subsanaciones += 1;
    }

    await this.solicitudesRepo.save(solicitud);

    // Si se aprueba, activa la cuenta y asigna el rol según el tipo de perfil
    if (nuevoEstado === 'aprobado') {
      const [estadoActivo, usuario] = await Promise.all([
        this.estadosCuentaRepo.findOne({ where: { codigo: 'activo' } }),
        this.usuariosRepo.findOne({
          where: { id: solicitud.usuario_id },
          relations: ['tipo_perfil'],
        }),
      ]);

      if (estadoActivo) {
        await this.usuariosRepo.update(solicitud.usuario_id, {
          estado_cuenta_id: estadoActivo.id,
          fecha_aprobacion: new Date(),
        });
      }

      // Asigna el rol correspondiente al tipo de perfil del usuario
      if (usuario?.tipo_perfil) {
        const codigoRol = ROL_POR_PERFIL[usuario.tipo_perfil.codigo];
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

        // Pobla el perfil público con los datos de la persona al aprobar
        await this.poblarPerfilAlAprobar(solicitud.usuario_id, usuario.tipo_persona, usuario.tipo_perfil.codigo);
      }
    }

    await this.registrarHistorial(
      solicitudId, estadoAnterior, nuevoEstado, adminId,
      `REVISION_${nuevoEstado.toUpperCase()}`, observaciones,
    );

    return { mensaje: `Solicitud actualizada a estado: ${nuevoEstado}` };
  }

  // El usuario corrige sus datos y reenvía la solicitud que está en subsanación (sin login)
  async subsanarSolicitud(solicitudId: number, dto: SubsanarRegistroDto) {
    const solicitud = await this.solicitudesRepo.findOne({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new NotFoundException('No se encontró la solicitud de registro');
    }
    if (solicitud.estado_solicitud !== 'subsanacion') {
      throw new ForbiddenException(
        `La solicitud no está en estado de subsanación. Estado actual: ${solicitud.estado_solicitud}`,
      );
    }

    // Actualiza los datos de la persona según lo que envíe el usuario
    if (dto.perfil_natural) {
      const persona = await this.personasNaturalesRepo.findOne({ where: { usuario_id: solicitud.usuario_id } });
      if (persona) {
        await this.personasNaturalesRepo.update(persona.id, dto.perfil_natural as any);
      }
    }

    if (dto.perfil_juridica) {
      const persona = await this.personasJuridicasRepo.findOne({ where: { usuario_id: solicitud.usuario_id } });
      if (persona) {
        await this.personasJuridicasRepo.update(persona.id, dto.perfil_juridica as any);
      }
    }

    if (dto.perfil_academico) {
      const perfil = await this.perfilesAcademicoRepo.findOne({ where: { usuario_id: solicitud.usuario_id } });
      if (perfil) {
        await this.perfilesAcademicoRepo.update(perfil.id, dto.perfil_academico as any);
      }
    }

    if (dto.perfil_proveedor) {
      const perfil = await this.perfilesProveedorRepo.findOne({
        where: { usuario_id: solicitud.usuario_id },
        relations: ['subcategorias', 'especialidades'],
      });
      if (perfil) {
        const { subcategoria_ids, especialidad_ids, ...camposBasicos } = dto.perfil_proveedor;
        Object.assign(perfil, camposBasicos);

        if (subcategoria_ids?.length) {
          perfil.subcategorias = await this.subcategoriasRepo.find({ where: { id: In(subcategoria_ids) } });
        }
        if (especialidad_ids?.length) {
          perfil.especialidades = await this.especialidadesRepo.find({ where: { id: In(especialidad_ids) } });
        }

        await this.perfilesProveedorRepo.save(perfil);
      }
    }

    // Regresa la solicitud a estado pendiente para revisión del admin
    const estadoAnterior = solicitud.estado_solicitud;
    solicitud.estado_solicitud = 'pendiente';
    solicitud.fecha_respuesta = null;
    await this.solicitudesRepo.save(solicitud);

    await this.registrarHistorial(
      solicitud.id,
      estadoAnterior,
      'pendiente',
      solicitud.usuario_id,
      'REENVIO_SUBSANACION',
      'Usuario corrigió los datos y reenvió la solicitud',
    );

    return { mensaje: 'Datos corregidos enviados. Su solicitud está nuevamente en revisión.' };
  }

  // Puebla el perfil público con los datos básicos de la persona al ser aprobada
  private async poblarPerfilAlAprobar(usuarioId: number, tipoPersona: string, codigoPerfil: string) {
    let nombrePublico = '';
    let sitioWeb: string | undefined;
    let descripcion: string | undefined;

    if (tipoPersona === 'natural') {
      const persona = await this.personasNaturalesRepo.findOne({ where: { usuario_id: usuarioId } });
      if (persona) {
        nombrePublico = [persona.primer_nombre, persona.segundo_nombre, persona.primer_apellido, persona.segundo_apellido]
          .filter(Boolean).join(' ');
      }
    } else {
      const persona = await this.personasJuridicasRepo.findOne({ where: { usuario_id: usuarioId } });
      if (persona) {
        nombrePublico = persona.razon_social;
        sitioWeb = persona.pagina_web ?? undefined;
        descripcion = persona.objeto_social ?? undefined;
      }
    }

    if (codigoPerfil === 'productora') {
      const perfil = await this.perfilesProductoraRepo.findOne({ where: { usuario_id: usuarioId } });
      if (perfil) {
        await this.perfilesProductoraRepo.update(perfil.id, {
          nombre_publico: nombrePublico || undefined,
          ...(sitioWeb && { sitio_web: sitioWeb }),
          ...(descripcion && { descripcion_empresa: descripcion }),
        });
      }
    } else if (codigoPerfil === 'proveedor') {
      const perfil = await this.perfilesProveedorRepo.findOne({ where: { usuario_id: usuarioId } });
      if (perfil) {
        await this.perfilesProveedorRepo.update(perfil.id, {
          ...(sitioWeb && { sitio_web: sitioWeb }),
          ...(descripcion && { descripcion_perfil: descripcion }),
        });
      }
    }
    // perfil_academico no tiene campos que mapeen directamente desde persona_natural/juridica
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
