import {
  IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearPersonaJuridicaDto {
  @ApiProperty({ example: 'Producciones Boyacá S.A.S.' })
  @IsString()
  razon_social: string;

  @ApiProperty({ example: '900123456-1' })
  @IsString()
  nit: string;

  @ApiPropertyOptional({ example: 2, description: 'ID del tipo de entidad (ver /catalogos/tipos-entidad)' })
  @IsOptional()
  @IsNumber()
  tipo_entidad_id?: number;

  @ApiPropertyOptional({ example: '2015-06-10' })
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
  direccion_fisica?: string;

  @ApiPropertyOptional({ example: '6017654321' })
  @IsOptional()
  @IsString()
  telefono_contacto?: string;

  @ApiPropertyOptional({ example: 'contacto@empresa.com' })
  @IsOptional()
  @IsEmail()
  correo_institucional?: string;

  @ApiPropertyOptional({ example: 'https://empresa.com' })
  @IsOptional()
  @IsString()
  pagina_web?: string;

  @ApiProperty({ example: 'Carlos Pérez' })
  @IsString()
  nombre_representante_legal: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de documento del representante' })
  @IsOptional()
  @IsNumber()
  tipo_documento_representante_id?: number;

  @ApiProperty({ example: '12345678' })
  @IsString()
  numero_documento_representante: string;

  @ApiPropertyOptional({ example: '2022-01-01' })
  @IsOptional()
  @IsDateString()
  fecha_inicio_nombramiento?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  fecha_fin_nombramiento?: string;

  @ApiPropertyOptional({ example: 'Cine, documental, publicidad' })
  @IsOptional()
  @IsString()
  areas_trabajo?: string;

  @ApiPropertyOptional({ example: 'Documental páramos de Boyacá (2023)' })
  @IsOptional()
  @IsString()
  proyectos_realizados?: string;

  @ApiPropertyOptional({ example: 'Serie documental cultura muisca' })
  @IsOptional()
  @IsString()
  proyectos_en_curso?: string;

  @ApiPropertyOptional({ example: 'Comunidades rurales, instituciones educativas' })
  @IsOptional()
  @IsString()
  publico_objetivo_beneficiarios?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  registro_soy_cultura?: boolean;

  @ApiPropertyOptional({ example: false })
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

  @ApiPropertyOptional({ example: 'Red Audiovisual de Boyacá' })
  @IsOptional()
  @IsString()
  cuales_redes_asociaciones?: string;
}
