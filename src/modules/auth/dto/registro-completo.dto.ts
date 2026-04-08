import {
  IsEmail, IsString, MinLength, IsIn, IsOptional,
  IsInt, IsPositive, ValidateNested, ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrearPersonaNaturalDto } from '../../usuarios/dto/crear-persona-natural.dto';
import { CrearPersonaJuridicaDto } from '../../usuarios/dto/crear-persona-juridica.dto';
import { RegistroPerfilProveedorDto } from './registro-perfil-proveedor.dto';
import { RegistroPerfilAcademicoDto } from './registro-perfil-academico.dto';

export class RegistroCompletoDto {
  @ApiProperty({ example: 'productora@email.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'MiPassword123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ enum: ['natural', 'juridica'], example: 'natural' })
  @IsIn(['natural', 'juridica'], { message: 'El tipo de persona debe ser natural o juridica' })
  tipo_persona: 'natural' | 'juridica';

  @ApiProperty({ example: 2, description: 'ID del tipo de perfil (ver /api/v1/catalogos/tipos-perfil)' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  tipo_perfil_id: number;

  @ApiPropertyOptional({ example: '3101234567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    type: () => CrearPersonaNaturalDto,
    description: 'Requerido cuando tipo_persona es "natural"',
  })
  @ValidateIf((o) => o.tipo_persona === 'natural')
  @ValidateNested()
  @Type(() => CrearPersonaNaturalDto)
  perfil_natural?: CrearPersonaNaturalDto;

  @ApiPropertyOptional({
    type: () => CrearPersonaJuridicaDto,
    description: 'Requerido cuando tipo_persona es "juridica"',
  })
  @ValidateIf((o) => o.tipo_persona === 'juridica')
  @ValidateNested()
  @Type(() => CrearPersonaJuridicaDto)
  perfil_juridica?: CrearPersonaJuridicaDto;

  @ApiPropertyOptional({
    type: () => RegistroPerfilProveedorDto,
    description: 'Datos del perfil de proveedor (categorías, especialidades, descripción). Solo aplica cuando tipo_perfil es "proveedor".',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegistroPerfilProveedorDto)
  perfil_proveedor?: RegistroPerfilProveedorDto;

  @ApiPropertyOptional({
    type: () => RegistroPerfilAcademicoDto,
    description: 'Datos del perfil académico (institución, aval, fecha estimada). Solo aplica cuando tipo_perfil es "academico".',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegistroPerfilAcademicoDto)
  perfil_academico?: RegistroPerfilAcademicoDto;
}
