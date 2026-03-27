import {
  IsString, IsOptional, IsNumber, IsBoolean,
  IsDateString, IsEmail, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearPersonaJuridicaDto {
  @ApiProperty({ example: 'Cine del Páramo S.A.S.', description: 'Razón social de la empresa' })
  @IsString()
  @MaxLength(255)
  razon_social: string;

  @ApiProperty({ example: '900123456-1', description: 'NIT de la empresa' })
  @IsString()
  @MaxLength(20)
  nit: string;

  @ApiPropertyOptional({ example: 2, description: 'ID del tipo de entidad (ver /catalogos/tipos-entidad)' })
  @IsOptional()
  @IsNumber()
  tipo_entidad_id?: number;

  @ApiPropertyOptional({ example: '2015-06-10', description: 'Fecha de constitución (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_constitucion?: string;

  @ApiPropertyOptional({ example: 'Producción y distribución de contenidos audiovisuales.' })
  @IsOptional()
  @IsString()
  objeto_social?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del municipio (ver /catalogos/municipios)' })
  @IsOptional()
  @IsNumber()
  municipio_id?: number;

  @ApiPropertyOptional({ example: 'Cra 10 #15-20, Tunja' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion_fisica?: string;

  @ApiPropertyOptional({ example: '6017654321' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono_contacto?: string;

  @ApiPropertyOptional({ example: 'contacto@cineparamo.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  correo_institucional?: string;

  @ApiPropertyOptional({ example: 'https://cinedelparamo.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pagina_web?: string;

  @ApiProperty({ example: 'Carlos Pérez', description: 'Nombre completo del representante legal' })
  @IsString()
  @MaxLength(255)
  nombre_representante_legal: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de documento del representante (ver /catalogos/tipos-identificacion)' })
  @IsOptional()
  @IsNumber()
  tipo_documento_representante_id?: number;

  @ApiProperty({ example: '12345678', description: 'Número de documento del representante legal' })
  @IsString()
  @MaxLength(50)
  numero_documento_representante: string;

  @ApiPropertyOptional({ example: '2022-01-01', description: 'Fecha de inicio del nombramiento del representante (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_inicio_nombramiento?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha de fin del nombramiento del representante (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_fin_nombramiento?: string;

  @ApiPropertyOptional({ example: 'Cine, documental, publicidad' })
  @IsOptional()
  @IsString()
  areas_trabajo?: string;

  @ApiPropertyOptional({ example: 'Documental sobre los páramos de Boyacá (2023), Cortometraje La Laguna (2022)' })
  @IsOptional()
  @IsString()
  proyectos_realizados?: string;

  @ApiPropertyOptional({ example: 'Serie documental cultura muisca (en producción)' })
  @IsOptional()
  @IsString()
  proyectos_en_curso?: string;

  @ApiPropertyOptional({ example: 'Comunidades rurales, instituciones educativas' })
  @IsOptional()
  @IsString()
  publico_objetivo_beneficiarios?: string;

  @ApiPropertyOptional({ example: true, description: '¿Está registrada en Soy Cultura?' })
  @IsOptional()
  @IsBoolean()
  registro_soy_cultura?: boolean;

  @ApiPropertyOptional({ example: false, description: '¿Está registrada en el Observatorio Cultural de Boyacá?' })
  @IsOptional()
  @IsBoolean()
  registro_observatorio_cultural_boyaca?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  ha_recibido_estimulos_apoyos_publicos?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  participa_redes_asociaciones?: boolean;

  @ApiPropertyOptional({ example: 'Red Audiovisual de Boyacá, CNACC' })
  @IsOptional()
  @IsString()
  cuales_redes_asociaciones?: string;
}
