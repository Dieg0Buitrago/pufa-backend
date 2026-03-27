import { IsString, IsOptional, IsInt, IsPositive, IsUrl, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GuardarPerfilProductoraDto {
  @ApiPropertyOptional({ example: 'María', description: 'Primer nombre' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  primer_nombre?: string;

  @ApiPropertyOptional({ example: 'Fernanda', description: 'Segundo nombre' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundo_nombre?: string;

  @ApiPropertyOptional({ example: 'González', description: 'Primer apellido' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  primer_apellido?: string;

  @ApiPropertyOptional({ example: 'Torres', description: 'Segundo apellido' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundo_apellido?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de identificación (ver /catalogos/tipos-identificacion)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  tipo_identificacion_id?: number;

  @ApiPropertyOptional({ example: '1012345678', description: 'Número de documento de identidad' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numero_documento?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del municipio de residencia (ver /catalogos/municipios)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  municipio_id?: number;

  @ApiPropertyOptional({ example: 'Cine del Páramo', description: 'Nombre público de la productora' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre_publico?: string;

  @ApiPropertyOptional({ example: 'Productora independiente enfocada en documentales.', description: 'Descripción de la empresa o proyecto' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion_empresa?: string;

  @ApiPropertyOptional({ example: 'https://cinedelparamo.com', description: 'Sitio web de la productora' })
  @IsOptional()
  @IsUrl({}, { message: 'El sitio web debe ser una URL válida' })
  @MaxLength(255)
  sitio_web?: string;
}
