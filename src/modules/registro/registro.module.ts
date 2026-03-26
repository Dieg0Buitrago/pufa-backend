import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroController } from './registro.controller';
import { RegistroService } from './registro.service';
import { SolicitudRegistro } from './entities/solicitud-registro.entity';
import { HistorialSolicitudRegistro } from './entities/historial-solicitud-registro.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { Rol } from '../auth/entities/rol.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';
import { TipoPerfil } from '../catalogos/entities/tipo-perfil.entity';
import { PersonaNatural } from '../usuarios/entities/persona-natural.entity';
import { PersonaJuridica } from '../usuarios/entities/persona-juridica.entity';
import { PerfilProductora } from '../perfiles/entities/perfil-productora.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudRegistro,
      HistorialSolicitudRegistro,
      Usuario,
      EstadoCuenta,
      Rol,
      UsuarioRol,
      TipoPerfil,
      PersonaNatural,
      PersonaJuridica,
      PerfilProductora,
    ]),
  ],
  controllers: [RegistroController],
  providers: [RegistroService],
  exports: [RegistroService],
})
export class RegistroModule {}
