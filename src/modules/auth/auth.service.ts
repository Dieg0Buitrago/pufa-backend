import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { Permiso } from './entities/permiso.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { RolPermiso } from './entities/rol-permiso.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { TipoPerfil } from '../catalogos/entities/tipo-perfil.entity';
import { SolicitudRegistro } from '../registro/entities/solicitud-registro.entity';
import { HistorialSolicitudRegistro } from '../registro/entities/historial-solicitud-registro.entity';
import { LoginDto } from './dto/login.dto';
import { RegistroUsuarioDto } from './dto/registro-usuario.dto';
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
    @InjectRepository(SolicitudRegistro)
    private solicitudesRepo: Repository<SolicitudRegistro>,
    @InjectRepository(HistorialSolicitudRegistro)
    private historialRepo: Repository<HistorialSolicitudRegistro>,
    private jwtService: JwtService,
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

    const tipoPerfil = await this.tiposPerfilRepo.findOne({
      where: { id: dto.tipo_perfil_id, activo: true },
    });
    if (!tipoPerfil) {
      throw new BadRequestException('El tipo de perfil seleccionado no existe o no está disponible');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const nuevoUsuario = this.usuariosRepo.create({
      email: dto.email,
      password_hash: passwordHash,
      tipo_persona: dto.tipo_persona,
      telefono: dto.telefono,
      estado_cuenta_id: estadoPendiente.id,
      tipo_perfil_id: tipoPerfil.id,
    });

    const usuarioGuardado = await this.usuariosRepo.save(nuevoUsuario);

    // Crea automáticamente la solicitud de registro para revisión del admin
    const solicitud = await this.solicitudesRepo.save(
      this.solicitudesRepo.create({
        usuario_id: usuarioGuardado.id,
        estado_solicitud: 'pendiente',
      }),
    );
    await this.historialRepo.save(
      this.historialRepo.create({
        solicitud_registro_id: solicitud.id,
        estado_nuevo: 'pendiente',
        usuario_actor_id: usuarioGuardado.id,
        accion: 'ENVIO_SOLICITUD',
        observacion: 'Solicitud creada automáticamente al registrarse',
      }),
    );

    return {
      mensaje: 'Registro exitoso. Su cuenta está pendiente de aprobación por un administrador.',
      usuario_id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
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

    // Solo se bloquea el login si la cuenta está inactiva o suspendida
    // Las cuentas en estado 'pendiente' pueden hacer login para enviar su solicitud de registro
    const estadosBloqueados = ['suspendido', 'rechazado'];
    if (estadosBloqueados.includes(usuario.estado_cuenta?.codigo)) {
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
      estadoCuenta: usuario.estado_cuenta?.codigo ?? '',
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        tipo_persona: usuario.tipo_persona,
        estado_cuenta: usuario.estado_cuenta?.codigo,
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
