import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CrearPersonaNaturalDto } from '../../usuarios/dto/crear-persona-natural.dto';
import { CrearPersonaJuridicaDto } from '../../usuarios/dto/crear-persona-juridica.dto';
import { RegistroPerfilProveedorDto } from '../../auth/dto/registro-perfil-proveedor.dto';
import { RegistroPerfilAcademicoDto } from '../../auth/dto/registro-perfil-academico.dto';

// Versiones parciales donde todos los campos son opcionales
class PersonaNaturalParcialDto extends PartialType(CrearPersonaNaturalDto) {}
class PersonaJuridicaParcialDto extends PartialType(CrearPersonaJuridicaDto) {}

export class SubsanarRegistroDto {
  @ApiPropertyOptional({
    description: 'Datos corregidos de persona natural. Enviar solo los campos que cambiaron.',
    type: () => PersonaNaturalParcialDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaNaturalParcialDto)
  perfil_natural?: PersonaNaturalParcialDto;

  @ApiPropertyOptional({
    description: 'Datos corregidos de persona jurídica. Enviar solo los campos que cambiaron.',
    type: () => PersonaJuridicaParcialDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaJuridicaParcialDto)
  perfil_juridica?: PersonaJuridicaParcialDto;

  @ApiPropertyOptional({
    description: 'Datos corregidos del perfil de proveedor (descripción, subcategorías, especialidades). Solo aplica si el perfil es proveedor.',
    type: () => RegistroPerfilProveedorDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegistroPerfilProveedorDto)
  perfil_proveedor?: RegistroPerfilProveedorDto;

  @ApiPropertyOptional({
    description: 'Datos corregidos del perfil académico. Solo aplica si el perfil es académico.',
    type: () => RegistroPerfilAcademicoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegistroPerfilAcademicoDto)
  perfil_academico?: RegistroPerfilAcademicoDto;
}
