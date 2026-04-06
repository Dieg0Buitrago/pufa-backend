import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Tramite } from './entities/tramite.entity';
import { TramiteLocacion } from './entities/tramite-locacion.entity';
import { TramiteEquipoTecnico } from './entities/tramite-equipo-tecnico.entity';
import { HistorialTramite } from './entities/historial-tramite.entity';
import { EstadoTramite } from '../catalogos/entities/estado-tramite.entity';
import { CrearTramiteDto } from './dto/crear-tramite.dto';

@Injectable()
export class TramitesService {
  constructor(
    @InjectRepository(Tramite) private tramitesRepo: Repository<Tramite>,
    @InjectRepository(TramiteLocacion) private locacionesRepo: Repository<TramiteLocacion>,
    @InjectRepository(TramiteEquipoTecnico) private equipoRepo: Repository<TramiteEquipoTecnico>,
    @InjectRepository(HistorialTramite) private historialRepo: Repository<HistorialTramite>,
    @InjectRepository(EstadoTramite) private estadosTramiteRepo: Repository<EstadoTramite>,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  // Lista trámites con paginación — admin ve todos, solicitante solo los suyos
  async listar(usuarioId: number, roles: string[], page = 1, limit = 20, estadoId?: number) {
    const esAdmin = roles.includes('admin') || roles.includes('revisor');
    const query = this.tramitesRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.estado_tramite', 'estado')
      .leftJoinAndSelect('t.tipo_tramite', 'tipo')
      .leftJoinAndSelect('t.proyecto', 'proyecto');

    if (!esAdmin) {
      query.where('t.usuario_solicitante_id = :usuarioId', { usuarioId });
    }

    if (estadoId) {
      query.andWhere('t.estado_tramite_id = :estadoId', { estadoId });
    }

    const [data, total] = await query
      .orderBy('t.fecha_solicitud', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // Obtiene trámite completo con todas sus relaciones
  async obtenerPorId(id: number, usuarioId: number, roles: string[]) {
    const tramite = await this.tramitesRepo.findOne({
      where: { id },
      relations: [
        'estado_tramite', 'tipo_tramite', 'proyecto',
        'locaciones', 'equipo_tecnico', 'historial',
      ],
    });
    if (!tramite) throw new NotFoundException(`Trámite #${id} no encontrado`);

    const esAdmin = roles.includes('admin') || roles.includes('revisor');
    if (!esAdmin && tramite.usuario_solicitante_id !== usuarioId) {
      throw new ForbiddenException('No tiene permiso para ver este trámite');
    }

    return tramite;
  }

  // Crea un nuevo trámite y genera número de radicado único — todo en una sola transacción
  async crear(usuarioId: number, dto: CrearTramiteDto) {
    if (!dto.compromiso_etico_aceptado || !dto.manejo_residuos_aceptado) {
      throw new BadRequestException('Debe aceptar todos los compromisos éticos obligatorios');
    }

    const estadoInicial = await this.estadosTramiteRepo.findOne({
      where: { nombre: 'Recibido' },
    });

    const numeroRadicado = this.generarNumeroRadicado();
    const porcentajeAbono = this.configService.get<number>('app.porcentajeAbonoDefault', 30);

    return this.dataSource.transaction(async (manager) => {
      const tramite = manager.create(Tramite, {
        proyecto_id: dto.proyecto_id,
        usuario_solicitante_id: usuarioId,
        tipo_tramite_id: dto.tipo_tramite_id,
        estado_tramite_id: estadoInicial?.id,
        numero_radicado: numeroRadicado,
        requiere_seguro_rc: dto.requiere_seguro_rc ?? false,
        requiere_aval_institucional: dto.requiere_aval_institucional ?? false,
        usa_drones: dto.usa_drones ?? false,
        requiere_permiso_aeronautica: dto.usa_drones ?? false,
        requiere_cierre_vias: dto.requiere_cierre_vias ?? false,
        requiere_plan_manejo_transito: dto.requiere_cierre_vias ?? false,
        compromiso_etico_aceptado: dto.compromiso_etico_aceptado,
        manejo_residuos_aceptado: dto.manejo_residuos_aceptado,
        consentimiento_comunidades_aplica: dto.consentimiento_comunidades_aplica ?? false,
        observaciones_generales: dto.observaciones_generales,
        porcentaje_abono: porcentajeAbono,
      });

      const tramiteGuardado = await manager.save(Tramite, tramite);

      // Guarda las locaciones del trámite
      if (dto.locaciones?.length) {
        const locaciones = dto.locaciones.map((l) =>
          manager.create(TramiteLocacion, { tramite_id: tramiteGuardado.id, ...l }),
        );
        await manager.save(TramiteLocacion, locaciones);
      }

      // Guarda el equipo técnico del trámite
      if (dto.equipo_tecnico?.length) {
        const equipo = dto.equipo_tecnico.map((e) =>
          manager.create(TramiteEquipoTecnico, { tramite_id: tramiteGuardado.id, ...e }),
        );
        await manager.save(TramiteEquipoTecnico, equipo);
      }

      // Registra el evento de creación en el historial
      await manager.save(
        manager.create(HistorialTramite, {
          tramite_id: tramiteGuardado.id,
          estado_nuevo_id: estadoInicial?.id,
          usuario_actor_id: usuarioId,
          accion: 'CREACION_TRAMITE',
          observacion: `Trámite creado con radicado ${numeroRadicado}`,
        }),
      );

      return tramiteGuardado;
    });
  }

  // Cambia el estado de un trámite (admin/revisor)
  async cambiarEstado(
    tramiteId: number,
    adminId: number,
    nuevoEstadoId: number,
    observacion: string,
  ) {
    const tramite = await this.tramitesRepo.findOne({ where: { id: tramiteId } });
    if (!tramite) throw new NotFoundException('Trámite no encontrado');

    const estadoAnteriorId = tramite.estado_tramite_id;
    await this.tramitesRepo.update(tramiteId, { estado_tramite_id: nuevoEstadoId });

    await this.historialRepo.save(
      this.historialRepo.create({
        tramite_id: tramiteId,
        estado_anterior_id: estadoAnteriorId,
        estado_nuevo_id: nuevoEstadoId,
        usuario_actor_id: adminId,
        accion: 'CAMBIO_ESTADO',
        observacion,
      }),
    );

    return { mensaje: 'Estado del trámite actualizado exitosamente' };
  }

  // Genera número de radicado único con formato PUFA-YYYYMMDD-XXXXXX
  private generarNumeroRadicado(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PUFA-${año}${mes}${dia}-${aleatorio}`;
  }
}
