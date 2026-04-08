import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RegistroPerfilAcademicoDto {
  @ApiPropertyOptional({ example: 'Universidad Pedagógica y Tecnológica de Colombia (UPTC)' })
  @IsOptional()
  @IsString()
  institucion_educativa?: string;

  @ApiPropertyOptional({ example: '2025-11-30', description: 'Fecha estimada de fin de estudios o del proyecto (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_fin_estimada?: string;

  @ApiPropertyOptional({ example: true, description: 'Indica si cuenta con aval de la institución educativa' })
  @IsOptional()
  @IsBoolean()
  tiene_aval_institucional?: boolean;

  @ApiPropertyOptional({ example: 'Trabajo de grado sobre cine documental en zonas rurales de Boyacá.' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
