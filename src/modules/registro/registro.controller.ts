import {
  Controller, Post, Get, Patch, Param, Body,
  Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiQuery, ApiBody,
} from '@nestjs/swagger';
import { RegistroService } from './registro.service';
import { RevisarSolicitudDto } from './dto/revisar-solicitud.dto';
import { SubsanarRegistroDto } from './dto/subsanar-registro.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('registro')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registro')
export class RegistroController {
  constructor(private readonly registroService: RegistroService) {}

  @Post('solicitudes')
  @ApiOperation({
    summary: 'Enviar solicitud de registro',
    description: 'El usuario autenticado envía su solicitud para que un administrador la revise y apruebe su cuenta.',
  })
  @ApiResponse({ status: 201, description: 'Solicitud creada. Pendiente de revisión.' })
  @ApiResponse({ status: 400, description: 'Ya existe una solicitud pendiente.' })
  crearSolicitud(@CurrentUser('id') usuarioId: number) {
    return this.registroService.crearSolicitud(usuarioId);
  }

  @Public()
  @Patch('solicitudes/:id/subsanar')
  @ApiOperation({
    summary: 'Corregir y reenviar solicitud en subsanación',
    description: 'Público — no requiere autenticación. El usuario usa el solicitud_id recibido al registrarse. Solo funciona si la solicitud está en estado subsanacion. Enviar únicamente los campos que necesitan corrección.',
  })
  @ApiParam({ name: 'id', description: 'ID de la solicitud recibido al registrarse' })
  @ApiBody({ type: SubsanarRegistroDto })
  @ApiResponse({ status: 200, description: 'Datos corregidos enviados. Solicitud vuelve a estado pendiente.' })
  @ApiResponse({ status: 403, description: 'La solicitud no está en estado de subsanación.' })
  @ApiResponse({ status: 404, description: 'No se encontró la solicitud.' })
  subsanar(
    @Param('id', ParseIntPipe) solicitudId: number,
    @Body() dto: SubsanarRegistroDto,
  ) {
    return this.registroService.subsanarSolicitud(solicitudId, dto);
  }

  @Roles('admin')
  @Get('solicitudes')
  @ApiOperation({ summary: 'Listar solicitudes de registro', description: 'Solo admin. Filtra por estado: pendiente, aprobado, rechazado, subsanacion.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'estado', required: false, example: 'pendiente', description: 'Filtrar por estado de la solicitud' })
  @ApiResponse({ status: 200, description: 'Listado paginado de solicitudes.' })
  listar(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('estado') estado?: string,
  ) {
    return this.registroService.listar(page, limit, estado);
  }

  @Roles('admin')
  @Patch('solicitudes/:id/revisar')
  @ApiOperation({
    summary: 'Revisar solicitud de registro',
    description: 'Admin aprueba, rechaza o solicita subsanación. Al aprobar, la cuenta del usuario se activa automáticamente.',
  })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  @ApiBody({
    schema: {
      properties: {
        estado: { type: 'string', enum: ['aprobado', 'rechazado', 'subsanacion'], example: 'aprobado' },
        observaciones: { type: 'string', example: 'Documentación completa y verificada.' },
      },
      required: ['estado', 'observaciones'],
    },
  })
  @ApiResponse({ status: 200, description: 'Solicitud actualizada.' })
  revisar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevisarSolicitudDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.registroService.revisarSolicitud(id, adminId, dto.estado, dto.observaciones);
  }
}
