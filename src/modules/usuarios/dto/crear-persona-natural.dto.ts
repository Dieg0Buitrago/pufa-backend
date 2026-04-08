import {
  IsString, IsOptional, IsNumber, IsBoolean,
  IsDateString, Min, Max, IsArray, IsIn, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiPropertyOptional({ example: 5, description: 'ID del nivel educativo: 1=Primaria, 2=Secundaria, 3=Técnico, 4=Tecnológico, 5=Universitario, 6=Especialización, 7=Maestría, 8=Doctorado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  nivel_educativo_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID dedicación al sector: 1=Tiempo completo, 2=Medio tiempo, 3=Por proyectos, 4=Ocasional' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tiempo_dedicacion_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID origen ingresos: 1=Principal fuente, 2=Fuente secundaria, 3=Complemento, 4=Sin ingresos aún' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ingresos_provienen_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID propiedad equipos: 1=Propios, 2=Arrendados, 3=Mixto, 4=No tiene equipos propios' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  equipos_propios_tipo_id?: number;

  @ApiPropertyOptional({ example: 2, description: 'ID gama equipos: 1=Básica, 2=Media, 3=Alta, 4=Profesional/cine' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gama_equipos_id?: number;

  @ApiPropertyOptional({ example: 2, description: 'ID experiencia en el sector: 1=Menos de 1 año, 2=1 a 3 años, 3=3 a 5 años, 4=5 a 10 años, 5=Más de 10 años' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tiempo_experiencia_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del rango de experiencia en el sector cultural en Boyacá (ver /catalogos/rangos-experiencia-sector)' })
  @IsOptional()
  @IsNumber()
  tiempo_experiencia_boyaca_id?: number;

  @ApiPropertyOptional({
    example: ['Municipal', 'Departamental'],
    description: 'Tipos de convocatoria a los que se presenta (Municipal, Departamental, Nacional, Internacional)',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsIn(['Municipal', 'Departamental', 'Nacional', 'Internacional'], { each: true })
  tipos_convocatoria?: string[];

  @ApiPropertyOptional({ example: 1, description: 'ID tipo de producción en que participa: 1=Cine, 2=Televisión, 3=Publicidad, 4=Documental, 5=Videoclip, 6=Cortometraje' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
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
