import { IsEmail, IsString, MinLength, IsIn, IsOptional, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistroUsuarioDto {
  @ApiProperty({ example: 'productora@email.com', description: 'Correo electrónico único del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'MiPassword123!', description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ enum: ['natural', 'juridica'], example: 'natural', description: 'Tipo de persona del usuario' })
  @IsIn(['natural', 'juridica'], { message: 'El tipo de persona debe ser natural o juridica' })
  tipo_persona: 'natural' | 'juridica';

  @ApiProperty({ example: 2, description: 'ID del tipo de perfil (ver /api/v1/catalogos/tipos-perfil): productora, proveedor, académico, etc.' })
  @Type(() => Number)
  @IsInt({ message: 'El tipo de perfil debe ser un número entero' })
  @IsPositive({ message: 'El tipo de perfil debe ser un ID válido' })
  tipo_perfil_id: number;

  @ApiPropertyOptional({ example: '3101234567', description: 'Número de teléfono de contacto' })
  @IsOptional()
  @IsString()
  telefono?: string;
}
