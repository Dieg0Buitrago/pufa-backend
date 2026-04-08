import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Documento } from './entities/documento.entity';
import { SolicitudRegistro } from '../registro/entities/solicitud-registro.entity';
import { TipoDocumento } from '../catalogos/entities/tipo-documento.entity';
import { Tramite } from '../tramites/entities/tramite.entity';

// Fragmentos de nombre para identificar tipos de documento especiales del trámite
const TIPO_PLAN_CONTINGENCIA = 'contingencia';
const TIPO_CONSENTIMIENTO_COMUNIDADES = 'consentimiento';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private documentosRepo: Repository<Documento>,
    @InjectRepository(SolicitudRegistro)
    private solicitudesRepo: Repository<SolicitudRegistro>,
    @InjectRepository(TipoDocumento)
    private tiposDocumentoRepo: Repository<TipoDocumento>,
    @InjectRepository(Tramite)
    private tramitesRepo: Repository<Tramite>,
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

    const documentoGuardado = await this.documentosRepo.save(documento);

    // Si el documento pertenece a un trámite, actualiza los flags correspondientes
    if (tramiteId && tipoDocumentoId) {
      await this.actualizarFlagsTramite(tramiteId, tipoDocumentoId);
    }

    return documentoGuardado;
  }

  // Actualiza plan_contingencia_entregado o consentimiento_comunidades_entregado según el tipo de documento
  private async actualizarFlagsTramite(tramiteId: number, tipoDocumentoId: number) {
    const tipo = await this.tiposDocumentoRepo.findOne({ where: { id: tipoDocumentoId } });
    if (!tipo) return;

    const nombre = tipo.nombre.toLowerCase();
    const actualizacion: Partial<Tramite> = {};

    if (nombre.includes(TIPO_PLAN_CONTINGENCIA)) {
      actualizacion.plan_contingencia_entregado = true;
    } else if (nombre.includes(TIPO_CONSENTIMIENTO_COMUNIDADES)) {
      actualizacion.consentimiento_comunidades_entregado = true;
    }

    if (Object.keys(actualizacion).length > 0) {
      await this.tramitesRepo.update(tramiteId, actualizacion);
    }
  }

  // Registra los 4 documentos obligatorios de una persona jurídica en una sola llamada
  async registrarDocumentosJuridica(
    usuarioId: number,
    archivos: {
      certificado_existencia?: Express.Multer.File[];
      acta_constitucion?: Express.Multer.File[];
      rut?: Express.Multer.File[];
      acta_nombramiento?: Express.Multer.File[];
    },
    solicitudRegistroId: number,
  ) {
    // Resuelve los IDs de tipos de documento por nombre usando ILIKE para evitar problemas con acentos
    const buscarTipo = async (fragmento: string) => {
      const result = await this.tiposDocumentoRepo
        .createQueryBuilder('t')
        .where('t.nombre ILIKE :fragmento', { fragmento: `%${fragmento}%` })
        .andWhere('t.activo = true')
        .getOne();
      return result?.id;
    };

    const campos = [
      { campo: 'certificado_existencia' as const, tipoId: await buscarTipo('mara de comercio') },
      { campo: 'acta_constitucion'      as const, tipoId: await buscarTipo('constituci') },
      { campo: 'rut'                    as const, tipoId: await buscarTipo('RUT') },
      { campo: 'acta_nombramiento'      as const, tipoId: await buscarTipo('nombramiento') },
    ];

    const resultados = await Promise.all(
      campos.map(async ({ campo, tipoId }) => {
        const archivo = archivos[campo]?.[0];
        if (!archivo) return null;
        // Desactiva versiones anteriores del mismo tipo para esta solicitud
        if (tipoId) {
          await this.documentosRepo.update(
            { solicitud_registro_id: solicitudRegistroId, tipo_documento_id: tipoId, activo: true },
            { activo: false },
          );
        }
        return this.registrarDocumento(usuarioId, archivo, tipoId, undefined, solicitudRegistroId);
      }),
    );

    return resultados.filter(Boolean);
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
