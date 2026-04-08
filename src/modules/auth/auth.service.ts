import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PersonaNatural } from '../usuarios/entities/persona-natural.entity';
import { PersonaJuridica } from '../usuarios/entities/persona-juridica.entity';
import { SolicitudRegistro } from '../registro/entities/solicitud-registro.entity';
import { HistorialSolicitudRegistro } from '../registro/entities/historial-solicitud-registro.entity';
import { Rol } from './entities/rol.entity';
import { Permiso } from './entities/permiso.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { RolPermiso } from './entities/rol-permiso.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { TipoPerfil } from '../catalogos/entities/tipo-perfil.entity';
import { PerfilProductora } from '../perfiles/entities/perfil-productora.entity';
import { PerfilProveedor } from '../perfiles/entities/perfil-proveedor.entity';
import { PerfilAcademico } from '../perfiles/entities/perfil-academico.entity';
import { SubcategoriaProveedor } from '../perfiles/entities/subcategoria-proveedor.entity';
import { EspecialidadProveedor } from '../perfiles/entities/especialidad-proveedor.entity';
import { LoginDto } from './dto/login.dto';
import { RegistroUsuarioDto } from './dto/registro-usuario.dto';
import { RegistroCompletoDto } from './dto/registro-completo.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { JwtPayload } from './strategies/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolesRepo: Repository<Rol>,
    @InjectRepository(Permiso)
    private permisosRepo: Repository<Permiso>,
    @InjectRepository(UsuarioRol)
    private usuarioRolesRepo: Repository<UsuarioRol>,
    @InjectRepository(RolPermiso)
    private rolPermisosRepo: Repository<RolPermiso>,
    @InjectRepository(EstadoCuenta)
    private estadosCuentaRepo: Repository<EstadoCuenta>,
    @InjectRepository(TipoPerfil)
    private tiposPerfilRepo: Repository<TipoPerfil>,
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
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  // Registra un nuevo usuario en estado PENDIENTE
  async registrar(dto: RegistroUsuarioDto) {
    const existe = await this.usuariosRepo.findOne({ where: { email: dto.email } });
    if (existe) {
      throw new ConflictException('Ya existe un usuario registrado con ese correo electrónico');
    }

    const estadoPendiente = await this.estadosCuentaRepo.findOne({
      where: { codigo: 'pendiente' },
    });
    if (!estadoPendiente) {
      throw new BadRequestException('Estado de cuenta pendiente no configurado en el sistema');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const tipoPerfil = await this.tiposPerfilRepo.findOne({ where: { id: dto.tipo_perfil_id } });
    if (!tipoPerfil) {
      throw new BadRequestException('El tipo de perfil seleccionado no existe');
    }

    const nuevoUsuario = this.usuariosRepo.create({
      email: dto.email,
      password_hash: passwordHash,
      tipo_persona: dto.tipo_persona,
      telefono: dto.telefono,
      estado_cuenta_id: estadoPendiente.id,
      tipo_perfil_id: dto.tipo_perfil_id,
    });

    const usuarioGuardado = await this.usuariosRepo.save(nuevoUsuario);

    return {
      mensaje: 'Registro exitoso. Su cuenta está pendiente de aprobación por un administrador.',
      usuario_id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
  }

  // Registra usuario completo con perfil y solicitud en una sola transacción
  async registrarCompleto(dto: RegistroCompletoDto) {
    const existe = await this.usuariosRepo.findOne({ where: { email: dto.email } });
    if (existe) {
      throw new ConflictException('Ya existe un usuario registrado con ese correo electrónico');
    }

    const [estadoPendiente, tipoPerfil] = await Promise.all([
      this.estadosCuentaRepo.findOne({ where: { codigo: 'pendiente' } }),
      this.tiposPerfilRepo.findOne({ where: { id: dto.tipo_perfil_id } }),
    ]);

    if (!estadoPendiente) {
      throw new BadRequestException('Estado de cuenta pendiente no configurado en el sistema');
    }
    if (!tipoPerfil) {
      throw new BadRequestException('El tipo de perfil seleccionado no existe');
    }

    if (dto.tipo_persona === 'natural' && !dto.perfil_natural) {
      throw new BadRequestException('Los datos de persona natural son requeridos');
    }
    if (dto.tipo_persona === 'juridica' && !dto.perfil_juridica) {
      throw new BadRequestException('Los datos de persona jurídica son requeridos');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.dataSource.transaction(async (manager) => {
      // 1. Crear usuario
      const usuario = await manager.save(
        manager.create(Usuario, {
          email: dto.email,
          password_hash: passwordHash,
          tipo_persona: dto.tipo_persona,
          telefono: dto.telefono,
          estado_cuenta_id: estadoPendiente.id,
          tipo_perfil_id: dto.tipo_perfil_id,
        }),
      );

      // 2. Crear perfil según tipo de persona
      if (dto.tipo_persona === 'natural') {
        await manager.save(
          manager.create(PersonaNatural, { usuario_id: usuario.id, ...dto.perfil_natural }),
        );
      } else {
        await manager.save(
          manager.create(PersonaJuridica, { usuario_id: usuario.id, ...dto.perfil_juridica }),
        );
      }

      // 3. Crear perfil según tipo de perfil (productora / proveedor / academico)
      const codigoPerfil = tipoPerfil.codigo?.toLowerCase();
      if (codigoPerfil === 'productora') {
        await manager.save(
          manager.create(PerfilProductora, { usuario_id: usuario.id }),
        );
      } else if (codigoPerfil === 'proveedor') {
        const datosProveedor = dto.perfil_proveedor;
        const perfilProveedor = manager.create(PerfilProveedor, {
          usuario_id: usuario.id,
          descripcion_perfil: datosProveedor?.descripcion_perfil,
          experiencia_sector_id: datosProveedor?.experiencia_sector_id,
          sitio_web: datosProveedor?.sitio_web,
        });
        const perfilGuardado = await manager.save(perfilProveedor);

        // Asocia subcategorías seleccionadas
        if (datosProveedor?.subcategoria_ids?.length) {
          perfilGuardado.subcategorias = await this.subcategoriasRepo.find({
            where: { id: In(datosProveedor.subcategoria_ids) },
          });
          await manager.save(perfilGuardado);
        }

        // Asocia especialidades seleccionadas
        if (datosProveedor?.especialidad_ids?.length) {
          perfilGuardado.especialidades = await this.especialidadesRepo.find({
            where: { id: In(datosProveedor.especialidad_ids) },
          });
          await manager.save(perfilGuardado);
        }
      } else if (codigoPerfil === 'academico') {
        await manager.save(
          manager.create(PerfilAcademico, {
            usuario_id: usuario.id,
            ...dto.perfil_academico,
          }),
        );
      }

      // 4. Crear solicitud de registro automáticamente
      const solicitud = await manager.save(
        manager.create(SolicitudRegistro, {
          usuario_id: usuario.id,
          estado_solicitud: 'pendiente',
        }),
      );

      // 5. Registrar en historial
      await manager.save(
        manager.create(HistorialSolicitudRegistro, {
          solicitud_registro_id: solicitud.id,
          estado_nuevo: 'pendiente',
          usuario_actor_id: usuario.id,
          accion: 'ENVIO_SOLICITUD',
          observacion: 'Solicitud enviada al completar el registro',
        }),
      );

      return {
        mensaje: 'Registro exitoso. Su solicitud está pendiente de aprobación por un administrador.',
        usuario_id: usuario.id,
        email: usuario.email,
        solicitud_id: solicitud.id,
      };
    });
  }

  // Valida credenciales y retorna token JWT con roles y permisos embebidos
  async login(dto: LoginDto) {
    const usuario = await this.usuariosRepo.findOne({
      where: { email: dto.email, activo: true },
      relations: ['estado_cuenta', 'tipo_perfil'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (usuario.estado_cuenta?.codigo !== 'activo') {
      throw new UnauthorizedException(
        `Su cuenta se encuentra en estado: ${usuario.estado_cuenta?.nombre ?? 'desconocido'}. Contacte al administrador.`,
      );
    }

    // Carga roles y permisos del usuario para embeber en el JWT
    const rolesPermisos = await this.obtenerRolesYPermisos(usuario.id);

    // Actualiza último login
    await this.usuariosRepo.update(usuario.id, { ultimo_login: new Date() });

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      roles: rolesPermisos.roles,
      permisos: rolesPermisos.permisos,
      tipoPerfil: usuario.tipo_perfil?.codigo ?? '',
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        tipo_persona: usuario.tipo_persona,
        roles: rolesPermisos.roles,
        tipo_perfil: usuario.tipo_perfil?.codigo,
      },
    };
  }

  // Retorna información del usuario autenticado
  async obtenerPerfil(usuarioId: number) {
    const usuario = await this.usuariosRepo.findOne({
      where: { id: usuarioId },
      relations: ['estado_cuenta', 'tipo_perfil'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const rolesPermisos = await this.obtenerRolesYPermisos(usuarioId);

    return {
      id: usuario.id,
      email: usuario.email,
      tipo_persona: usuario.tipo_persona,
      telefono: usuario.telefono,
      estado_cuenta: usuario.estado_cuenta?.nombre,
      tipo_perfil: usuario.tipo_perfil?.nombre,
      roles: rolesPermisos.roles,
      permisos: rolesPermisos.permisos,
      ultimo_login: usuario.ultimo_login,
      fecha_registro: usuario.fecha_registro,
    };
  }

  // Permite al usuario cambiar su propia contraseña
  async cambiarPassword(usuarioId: number, dto: CambiarPasswordDto) {
    const usuario = await this.usuariosRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const passwordValido = await bcrypt.compare(dto.password_actual, usuario.password_hash);
    if (!passwordValido) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const nuevoHash = await bcrypt.hash(dto.password_nuevo, 10);
    await this.usuariosRepo.update(usuarioId, { password_hash: nuevoHash });

    return { mensaje: 'Contraseña actualizada exitosamente' };
  }

  // Obtiene los códigos de roles y permisos de un usuario (para JWT)
  private async obtenerRolesYPermisos(usuarioId: number) {
    const usuarioRoles = await this.usuarioRolesRepo.find({
      where: { usuario_id: usuarioId, activo: true },
      relations: ['rol'],
    });

    const roles = usuarioRoles
      .filter((ur) => ur.rol?.activo)
      .map((ur) => ur.rol.codigo);

    const rolIds = usuarioRoles.map((ur) => ur.rol_id);
    if (rolIds.length === 0) return { roles, permisos: [] };

    const rolPermisos = await this.rolPermisosRepo.find({
      where: rolIds.map((id) => ({ rol_id: id, activo: true })),
      relations: ['permiso'],
    });

    const permisos = [
      ...new Set(
        rolPermisos
          .filter((rp) => rp.permiso?.activo)
          .map((rp) => rp.permiso.codigo),
      ),
    ];

    return { roles, permisos };
  }
}
