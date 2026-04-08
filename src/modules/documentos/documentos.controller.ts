import {
  Controller, Get, Post, Patch, Param, Body,
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('documentos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post('subir')
  @ApiOperation({
    summary: 'Subir documento',
    description: 'Carga un archivo y lo registra con hash SHA256 para verificación de integridad. Máximo 10 MB. Formatos aceptados: PDF, JPG, PNG, DOCX.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: { type: 'string', format: 'binary', description: 'Archivo a subir (máx. 10 MB)' },
        tipo_documento_id: { type: 'number', example: 1, description: 'ID del tipo de documento' },
        tramite_id: { type: 'number', example: 1, description: 'ID del trámite al que pertenece' },
        solicitud_registro_id: { type: 'number', description: 'ID de la solicitud de registro (alternativo a tramite_id)' },
      },
      required: ['archivo'],
    },
  })
  @ApiResponse({ status: 201, description: 'Documento registrado con hash SHA256.' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, nombre);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
    }),
  )
  subirDocumento(
    @UploadedFile() archivo: Express.Multer.File,
    @CurrentUser('id') usuarioId: number,
    @Body('tipo_documento_id', new ParseIntPipe({ optional: true })) tipoDocumentoId?: number,
    @Body('tramite_id', new ParseIntPipe({ optional: true })) tramiteId?: number,
    @Body('solicitud_registro_id', new ParseIntPipe({ optional: true })) solicitudId?: number,
  ) {
    return this.documentosService.registrarDocumento(
      usuarioId, archivo, tipoDocumentoId, tramiteId, solicitudId,
    );
  }

  @Public()
  @Post('subir-registro')
  @ApiOperation({
    summary: 'Subir documentos de registro',
    description: 'Público — no requiere autenticación. Sube todos los documentos de una solicitud de registro en un solo request. Campos aceptados: certificado_existencia, acta_constitucion, rut, acta_nombramiento, documento_identidad. Máximo 10 MB por archivo.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        solicitud_registro_id: { type: 'number', example: 41, description: 'ID de la solicitud recibido al registrarse' },
        certificado_existencia: { type: 'string', format: 'binary' },
        acta_constitucion: { type: 'string', format: 'binary' },
        rut: { type: 'string', format: 'binary' },
        acta_nombramiento: { type: 'string', format: 'binary' },
        documento_identidad: { type: 'string', format: 'binary' },
      },
      required: ['solicitud_registro_id'],
    },
  })
  @ApiResponse({ status: 201, description: 'Documentos subidos y asociados a la solicitud de registro.' })
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, nombre);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  subirDocumentosRegistro(
    @UploadedFiles() archivos: Express.Multer.File[],
    @Body('solicitud_registro_id', ParseIntPipe) solicitudRegistroId: number,
  ) {
    const archivosConCampo = archivos.map((file) => ({ campo: file.fieldname, file }));
    return this.documentosService.registrarDocumentosRegistro(solicitudRegistroId, archivosConCampo);
  }

  @Get('tramite/:tramiteId')
  @ApiOperation({ summary: 'Listar documentos de un trámite' })
  @ApiParam({ name: 'tramiteId', description: 'ID del trámite' })
  @ApiResponse({ status: 200, description: 'Lista de documentos del trámite con su estado de validación.' })
  listarPorTramite(@Param('tramiteId', ParseIntPipe) tramiteId: number) {
    return this.documentosService.listarPorTramite(tramiteId);
  }

  @Roles('admin')
  @Patch(':id/validar')
  @ApiOperation({ summary: 'Validar documento', description: 'Admin aprueba o rechaza un documento adjunto.' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiBody({
    schema: {
      properties: {
        estado_validacion: { type: 'string', enum: ['aprobado', 'rechazado'], example: 'aprobado' },
        observaciones_validacion: { type: 'string', example: 'Documento legible y vigente.' },
      },
      required: ['estado'],
    },
  })
  @ApiResponse({ status: 200, description: 'Documento validado.' })
  validar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
    @Body('estado_validacion') estado: 'aprobado' | 'rechazado',
    @Body('observaciones_validacion') observaciones?: string,
  ) {
    return this.documentosService.validarDocumento(id, adminId, estado, observaciones);
  }
}
