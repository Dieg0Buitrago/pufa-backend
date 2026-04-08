import {
  Controller, Post, Get, Body, UseGuards, Patch,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistroUsuarioDto } from './dto/registro-usuario.dto';
import { RegistroCompletoDto } from './dto/registro-completo.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registro completo en un solo paso',
    description: 'Crea el usuario, su perfil (natural o jurídica) y la solicitud de activación en una sola transacción. El administrador debe aprobar la solicitud para que pueda iniciar sesión.',
  })
  @ApiResponse({ status: 201, description: 'Registro exitoso. Solicitud pendiente de aprobación.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o tipo de perfil no existe.' })
  @ApiResponse({ status: 409, description: 'Ya existe un usuario con ese correo.' })
  registrarCompleto(@Body() dto: RegistroCompletoDto) {
    return this.authService.registrarCompleto(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Valida credenciales y retorna un JWT con roles y permisos embebidos.' })
  @ApiResponse({ status: 200, description: 'Login exitoso. Retorna access_token JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas o cuenta no activa.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado', description: 'Retorna los datos del usuario autenticado incluyendo sus roles y permisos.' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado.' })
  obtenerPerfil(@CurrentUser('id') usuarioId: number) {
    return this.authService.obtenerPerfil(usuarioId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('cambiar-password')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Cambiar contraseña', description: 'Permite al usuario autenticado cambiar su propia contraseña.' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente.' })
  @ApiResponse({ status: 401, description: 'La contraseña actual es incorrecta.' })
  cambiarPassword(
    @CurrentUser('id') usuarioId: number,
    @Body() dto: CambiarPasswordDto,
  ) {
    return this.authService.cambiarPassword(usuarioId, dto);
  }
}
