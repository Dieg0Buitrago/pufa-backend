import {
  IsString, IsOptional, IsNumber, IsBoolean,
  IsDateString, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearPersonaNaturalDto {
  @ApiProperty({ example: 'María' })
  @IsString()
  primer_nombre: string;

  @ApiPropertyOptional({ example: 'Fernanda' })
  @IsOptional()
  @IsString()
  segundo_nombre?: string;

  @ApiProperty({ example: 'González' })
  @IsString()
  primer_apellido: string;

  @ApiPropertyOptional({ example: 'Torres' })
  @IsOptional()
  @IsString()
  segundo_apellido?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de identificación (ver /catalogos/tipos-identificacion)' })
  @IsOptional()
  @IsNumber()
  tipo_identificacion_id?: number;

  @ApiProperty({ example: '1012345678' })
  @IsString()
  numero_documento: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del municipio de residencia (ver /catalogos/municipios)' })
  @IsOptional()
  @IsNumber()
  municipio_residencia_id?: number;

  @ApiPropertyOptional({ example: 'Calle 10 # 5-30, Tunja' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: 'Tunja', description: 'Ciudad o municipio de nacimiento' })
  @IsOptional()
  @IsString()
  lugar_nacimiento?: string;

  @ApiPropertyOptional({ example: '1995-06-15', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del sexo al nacer (ver /catalogos/sexos-nacer)' })
  @IsOptional()
  @IsNumber()
  sexo_nacer_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de identidad de género (ver /catalogos/identidades-genero)' })
  @IsOptional()
  @IsNumber()
  identidad_genero_id?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  pertenece_grupo_etnico?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'ID del grupo étnico (ver /catalogos/grupos-etnicos)' })
  @IsOptional()
  @IsNumber()
  grupo_etnico_id?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  tiene_discapacidad?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de discapacidad (ver /catalogos/tipos-discapacidad)' })
  @IsOptional()
  @IsNumber()
  tipo_discapacidad_id?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  vive_zona_rural?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  se_considera_campesino?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  victima_conflicto_armado?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  migrante_refugiado?: boolean;

  @ApiPropertyOptional({ example: 5, description: 'ID del nivel educativo (ver /catalogos/niveles-educativos)' })
  @IsOptional()
  @IsNumber()
  nivel_educativo_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tiempo de dedicación al sector (ver /catalogos/tiempos-dedicacion-sector)' })
  @IsOptional()
  @IsNumber()
  tiempo_dedicacion_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de ingresos del sector (ver /catalogos/tipos-ingresos-sector)' })
  @IsOptional()
  @IsNumber()
  ingresos_provienen_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de propiedad de equipos (ver /catalogos/tipos-propiedad-equipos)' })
  @IsOptional()
  @IsNumber()
  equipos_propios_tipo_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de la gama de equipos (ver /catalogos/gamas-equipos)' })
  @IsOptional()
  @IsNumber()
  gama_equipos_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del rango de experiencia en el sector (ver /catalogos/rangos-experiencia-sector)' })
  @IsOptional()
  @IsNumber()
  tiempo_experiencia_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de producción en que participa (ver /catalogos/tipos-produccion-participa)' })
  @IsOptional()
  @IsNumber()
  produccion_participa_id?: number;

  @ApiPropertyOptional({ example: 3, description: 'Nivel de inglés hablado del 0 (ninguno) al 5 (nativo)' })
  @IsOptional()
  @IsNumber()
  @Min(0) @Max(5)
  ingles_habla?: number;

  @ApiPropertyOptional({ example: 4, description: 'Nivel de inglés de lectura del 0 al 5' })
  @IsOptional()
  @IsNumber()
  @Min(0) @Max(5)
  ingles_lee?: number;

  @ApiPropertyOptional({ example: 2, description: 'Nivel de inglés escrito del 0 al 5' })
  @IsOptional()
  @IsNumber()
  @Min(0) @Max(5)
  ingles_escribe?: number;
}
