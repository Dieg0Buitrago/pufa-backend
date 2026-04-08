import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { Documento } from './entities/documento.entity';
import { SolicitudRegistro } from '../registro/entities/solicitud-registro.entity';
import { TipoDocumento } from '../catalogos/entities/tipo-documento.entity';
import { Tramite } from '../tramites/entities/tramite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Documento, SolicitudRegistro, TipoDocumento, Tramite])],
  controllers: [DocumentosController],
  providers: [DocumentosService],
  exports: [DocumentosService],
})
export class DocumentosModule {}
