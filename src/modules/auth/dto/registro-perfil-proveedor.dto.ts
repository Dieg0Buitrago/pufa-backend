import {
  IsOptional, IsString, IsInt, IsArray, IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RegistroPerfilProveedorDto {
  @ApiPropertyOptional({ example: 'Director de movilización y seguridad en proyectos fílmicos.' })
  @IsOptional()
  @IsString()
  descripcion_perfil?: string;

  @ApiPropertyOptional({ example: 3, description: 'ID del rango de experiencia en el sector (ver /api/v1/catalogos/rangos-experiencia-sector)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  experiencia_sector_id?: number;

  @ApiPropertyOptional({ example: 'https://juanperez.com' })
  @IsOptional()
  @IsString()
  sitio_web?: string;

  @ApiPropertyOptional({
    example: [3],
    description: 'IDs de subcategorías del proveedor (ver GET /api/v1/perfiles/categorias)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  subcategoria_ids?: number[];

  @ApiPropertyOptional({
    example: [9, 10],
    description: 'IDs de especialidades del proveedor (ver GET /api/v1/perfiles/categorias)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  especialidad_ids?: number[];
}
