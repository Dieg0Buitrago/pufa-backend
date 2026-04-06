import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidarDocumentoDto {
  @ApiProperty({ enum: ['aprobado', 'rechazado'], example: 'aprobado' })
  @IsIn(['aprobado', 'rechazado'], {
    message: 'El estado_validacion debe ser: aprobado o rechazado',
  })
  estado_validacion: 'aprobado' | 'rechazado';

  @ApiPropertyOptional({ example: 'Documento legible y vigente.' })
  @IsOptional()
  @IsString()
  observaciones_validacion?: string;
}
