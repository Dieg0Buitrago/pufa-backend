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
}
