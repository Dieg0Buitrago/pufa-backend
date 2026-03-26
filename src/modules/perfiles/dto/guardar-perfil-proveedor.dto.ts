import {
  IsString, IsOptional, IsInt, IsPositive,
  IsBoolean, IsArray, IsUrl, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GuardarPerfilProveedorDto {
  @ApiPropertyOptional({
    example: 'Director de fotografía con 8 años de experiencia en cine colombiano.',
    description: 'Descripción del perfil que aparece en el directorio público',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion_perfil?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID del rango de experiencia en el sector (ver /catalogos/rangos-experiencia)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  experiencia_sector_id?: number;

  @ApiPropertyOptional({
    example: 'https://juanperez.com',
    description: 'Sitio web o portafolio del proveedor',
  })
  @IsOptional()
  @IsUrl({}, { message: 'El sitio web debe ser una URL válida' })
  @MaxLength(255)
  sitio_web?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Si el proveedor desea aparecer en el directorio público',
  })
  @IsOptional()
  @IsBoolean()
  visible_directorio?: boolean;

  @ApiPropertyOptional({
    example: [3, 7],
    description: 'IDs de las subcategorías de proveedor seleccionadas (ver /perfiles/categorias)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  subcategoria_ids?: number[];

  @ApiPropertyOptional({
    example: [12, 15, 48],
    description: 'IDs de las especialidades seleccionadas (ver /perfiles/categorias)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  especialidad_ids?: number[];
}
