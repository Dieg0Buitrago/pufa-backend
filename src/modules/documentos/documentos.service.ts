import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Documento } from './entities/documento.entity';
import { SolicitudRegistro } from '../registro/entities/solicitud-registro.entity';
import { TipoDocumento } from '../catalogos/entities/tipo-documento.entity';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private documentosRepo: Repository<Documento>,
    @InjectRepository(SolicitudRegistro)
    private solicitudesRepo: Repository<SolicitudRegistro>,
    @InjectRepository(TipoDocumento)
    private tiposDocumentoRepo: Repository<TipoDocumento>,
  ) {}

  // Registra un archivo subido con su hash SHA256
  async registrarDocumento(
    usuarioId: number,
    archivo: Express.Multer.File,
    tipoDocumentoId?: number,
    tramiteId?: number,
    solicitudRegistroId?: number,
  ) {
    // Calcula hash SHA256 para verificar integridad del archivo
    const buffer = fs.readFileSync(archivo.path);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Obtiene la versión más reciente para este tipo de documento y contexto
    const versionActual = await this.documentosRepo.count({
      where: {
        usuario_id: usuarioId,
        tipo_documento_id: tipoDocumentoId,
        tramite_id: tramiteId,
        activo: true,
      },
    });

    const documento = this.documentosRepo.create({
      usuario_id: usuarioId,
      tramite_id: tramiteId,
      solicitud_registro_id: solicitudRegistroId,
      tipo_documento_id: tipoDocumentoId,
      version: versionActual + 1,
      nombre_original: archivo.originalname,
      nombre_guardado: archivo.filename,
      ruta_archivo: archivo.path,
      mime_type: archivo.mimetype,
      tamano_bytes: archivo.size,
      hash_sha256: hash,
      estado_validacion: 'pendiente',
    });

    return this.documentosRepo.save(documento);
  }

  // Registra múltiples archivos asociados a una solicitud de registro (sin autenticación)
  async registrarDocumentosRegistro(
    solicitudRegistroId: number,
    archivos: { campo: string; file: Express.Multer.File }[],
  ) {
    const solicitud = await this.solicitudesRepo.findOne({ where: { id: solicitudRegistroId } });
    if (!solicitud) throw new NotFoundException('Solicitud de registro no encontrada');

    // Carga todos los tipos de documento para mapear por código
    const tiposDocumento = await this.tiposDocumentoRepo.find({ where: { activo: true } });
    const tiposPorCodigo = new Map(tiposDocumento.map((t) => [t.codigo, t.id]));

    const resultados = await Promise.all(
      archivos.map(({ campo, file }) => {
        const buffer = fs.readFileSync(file.path);
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');

        const documento = this.documentosRepo.create({
          usuario_id: solicitud.usuario_id,
          solicitud_registro_id: solicitudRegistroId,
          tipo_documento_id: tiposPorCodigo.get(campo) ?? undefined,
          nombre_original: file.originalname,
          nombre_guardado: file.filename,
          ruta_archivo: file.path,
          mime_type: file.mimetype,
          tamano_bytes: file.size,
          hash_sha256: hash,
          estado_validacion: 'pendiente',
          version: 1,
        });

        return this.documentosRepo.save(documento);
      }),
    );

    return {
      mensaje: `${resultados.length} documento(s) subido(s) exitosamente.`,
      documentos: resultados.map((d) => ({
        id: d.id,
        nombre_original: d.nombre_original,
        hash_sha256: d.hash_sha256,
        estado_validacion: d.estado_validacion,
      })),
    };
  }

  // Lista documentos de un trámite
  async listarPorTramite(tramiteId: number) {
    return this.documentosRepo.find({
      where: { tramite_id: tramiteId, activo: true },
      relations: ['tipo_documento'],
      order: { fecha_subida: 'DESC' },
    });
  }

  // Valida o rechaza un documento (admin)
  async validarDocumento(
    documentoId: number,
    adminId: number,
    estadoValidacion: 'aprobado' | 'rechazado',
    observaciones?: string,
  ) {
    const documento = await this.documentosRepo.findOne({ where: { id: documentoId } });
    if (!documento) throw new NotFoundException('Documento no encontrado');

    await this.documentosRepo.update(documentoId, {
      estado_validacion: estadoValidacion,
      observaciones_validacion: observaciones,
      validado_por_usuario_id: adminId,
      fecha_validacion: new Date(),
    });

    return { mensaje: `Documento ${estadoValidacion} exitosamente` };
  }
}
