import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Municipio } from './entities/municipio.entity';
import { TipoProduccion } from './entities/tipo-produccion.entity';
import { EstadoTramite } from './entities/estado-tramite.entity';
import { TipoEspacio } from './entities/tipo-espacio.entity';
import { RolEquipoTecnico } from './entities/rol-equipo-tecnico.entity';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity';
import { IdentidadGenero } from './entities/identidad-genero.entity';
import { NivelEducativo } from './entities/nivel-educativo.entity';
import { TipoTramite } from './entities/tipo-tramite.entity';
import { TipoPago } from './entities/tipo-pago.entity';
import { EstadoPago } from './entities/estado-pago.entity';
import { TipoPerfil } from './entities/tipo-perfil.entity';
import { TipoDocumento } from './entities/tipo-documento.entity';
import { TipoEntidad } from './entities/tipo-entidad.entity';
import { SexoNacer } from './entities/sexo-nacer.entity';
import { GrupoEtnico } from './entities/grupo-etnico.entity';
import { TipoDiscapacidad } from './entities/tipo-discapacidad.entity';
import { TiempoDedicacionSector } from './entities/tiempo-dedicacion-sector.entity';
import { TipoIngresosSector } from './entities/tipo-ingresos-sector.entity';
import { TipoPropiedadEquipos } from './entities/tipo-propiedad-equipos.entity';
import { GamaEquipos } from './entities/gama-equipos.entity';
import { RangoExperienciaSector } from './entities/rango-experiencia-sector.entity';
import { TipoProduccionParticipa } from './entities/tipo-produccion-participa.entity';

// Servicio de catálogos — datos de referencia sin lógica de negocio compleja
@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Municipio) private municipiosRepo: Repository<Municipio>,
    @InjectRepository(TipoProduccion) private tiposProduccionRepo: Repository<TipoProduccion>,
    @InjectRepository(EstadoTramite) private estadosTramiteRepo: Repository<EstadoTramite>,
    @InjectRepository(TipoEspacio) private tiposEspacioRepo: Repository<TipoEspacio>,
    @InjectRepository(RolEquipoTecnico) private rolesEquipoRepo: Repository<RolEquipoTecnico>,
    @InjectRepository(TipoIdentificacion) private tiposIdRepo: Repository<TipoIdentificacion>,
    @InjectRepository(IdentidadGenero) private identidadesGeneroRepo: Repository<IdentidadGenero>,
    @InjectRepository(NivelEducativo) private nivelesEducativosRepo: Repository<NivelEducativo>,
    @InjectRepository(TipoTramite) private tiposTramiteRepo: Repository<TipoTramite>,
    @InjectRepository(TipoPago) private tiposPagoRepo: Repository<TipoPago>,
    @InjectRepository(EstadoPago) private estadosPagoRepo: Repository<EstadoPago>,
    @InjectRepository(TipoPerfil) private tiposPerfilRepo: Repository<TipoPerfil>,
    @InjectRepository(TipoDocumento) private tiposDocumentoRepo: Repository<TipoDocumento>,
    @InjectRepository(TipoEntidad) private tiposEntidadRepo: Repository<TipoEntidad>,
    @InjectRepository(SexoNacer) private sexosNacerRepo: Repository<SexoNacer>,
    @InjectRepository(GrupoEtnico) private gruposEtnicosRepo: Repository<GrupoEtnico>,
    @InjectRepository(TipoDiscapacidad) private tiposDiscapacidadRepo: Repository<TipoDiscapacidad>,
    @InjectRepository(TiempoDedicacionSector) private tiemposDedicacionRepo: Repository<TiempoDedicacionSector>,
    @InjectRepository(TipoIngresosSector) private tiposIngresosRepo: Repository<TipoIngresosSector>,
    @InjectRepository(TipoPropiedadEquipos) private tiposPropiedadEquiposRepo: Repository<TipoPropiedadEquipos>,
    @InjectRepository(GamaEquipos) private gamasEquiposRepo: Repository<GamaEquipos>,
    @InjectRepository(RangoExperienciaSector) private rangosExperienciaRepo: Repository<RangoExperienciaSector>,
    @InjectRepository(TipoProduccionParticipa) private tiposProduccionParticipaRepo: Repository<TipoProduccionParticipa>,
  ) {}

  obtenerMunicipios() {
    return this.municipiosRepo.find({ order: { nombre: 'ASC' } });
  }

  obtenerTiposProduccion() {
    return this.tiposProduccionRepo.find({ where: { activo: true } });
  }

  obtenerEstadosTramite() {
    return this.estadosTramiteRepo.find({ where: { activo: true }, order: { orden: 'ASC' } });
  }

  obtenerTiposEspacio() {
    return this.tiposEspacioRepo.find({ where: { activo: true } });
  }

  obtenerRolesEquipoTecnico() {
    return this.rolesEquipoRepo.find({ where: { activo: true } });
  }

  obtenerTiposIdentificacion() {
    return this.tiposIdRepo.find();
  }

  obtenerIdentidadesGenero() {
    return this.identidadesGeneroRepo.find();
  }

  obtenerNivelesEducativos() {
    return this.nivelesEducativosRepo.find();
  }

  obtenerTiposTramite() {
    return this.tiposTramiteRepo.find({ where: { activo: true } });
  }

  obtenerTiposPago() {
    return this.tiposPagoRepo.find({ where: { activo: true } });
  }

  obtenerEstadosPago() {
    return this.estadosPagoRepo.find({ where: { activo: true } });
  }

  obtenerTiposPerfil() {
    return this.tiposPerfilRepo.find({ where: { activo: true }, order: { id: 'ASC' } });
  }

  obtenerTiposDocumento() {
    return this.tiposDocumentoRepo.find({ order: { id: 'ASC' } });
  }

  obtenerTiposEntidad() {
    return this.tiposEntidadRepo.find({ order: { id: 'ASC' } });
  }

  obtenerSexosNacer() {
    return this.sexosNacerRepo.find({ order: { id: 'ASC' } });
  }

  obtenerGruposEtnicos() {
    return this.gruposEtnicosRepo.find({ order: { id: 'ASC' } });
  }

  obtenerTiposDiscapacidad() {
    return this.tiposDiscapacidadRepo.find({ order: { id: 'ASC' } });
  }

  obtenerTiemposDedicacionSector() {
    return this.tiemposDedicacionRepo.find({ order: { id: 'ASC' } });
  }

  obtenerTiposIngresosSector() {
    return this.tiposIngresosRepo.find({ order: { id: 'ASC' } });
  }

  obtenerTiposPropiedadEquipos() {
    return this.tiposPropiedadEquiposRepo.find({ order: { id: 'ASC' } });
  }

  obtenerGamasEquipos() {
    return this.gamasEquiposRepo.find({ order: { id: 'ASC' } });
  }

  obtenerRangosExperienciaSector() {
    return this.rangosExperienciaRepo.find({ order: { id: 'ASC' } });
  }

  obtenerTiposProduccionParticipa() {
    return this.tiposProduccionParticipaRepo.find({ order: { id: 'ASC' } });
  }
}
