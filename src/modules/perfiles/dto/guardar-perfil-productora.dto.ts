import { IsString, IsOptional, IsInt, IsPositive, IsBoolean, IsUrl, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GuardarPerfilProductoraDto {
  @ApiPropertyOptional({
    example: 'Cine del Páramo',
    description: 'Nombre público de la productora que aparece en el directorio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre_publico?: string;

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
    example: 'Productora independiente enfocada en documentales de cultura andina.',
    description: 'Descripción de la empresa o proyecto productora',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion_empresa?: string;

  @ApiPropertyOptional({
    example: 'https://cinedelparamo.com',
    description: 'Sitio web de la productora',
  })
  @IsOptional()
  @IsUrl({}, { message: 'El sitio web debe ser una URL válida' })
  @MaxLength(255)
  sitio_web?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Si la productora desea aparecer en el directorio público',
  })
  @IsOptional()
  @IsBoolean()
  visible_directorio?: boolean;
}
