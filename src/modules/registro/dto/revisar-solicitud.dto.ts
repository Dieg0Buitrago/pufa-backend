import { IsIn, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevisarSolicitudDto {
  @ApiProperty({
    enum: ['aprobado', 'rechazado', 'subsanacion'],
    example: 'aprobado',
    description: 'Nuevo estado de la solicitud',
  })
  @IsIn(['aprobado', 'rechazado', 'subsanacion'], {
    message: 'El estado debe ser: aprobado, rechazado o subsanacion',
  })
  estado: 'aprobado' | 'rechazado' | 'subsanacion';

  @ApiProperty({ example: 'Documentación completa y verificada.' })
  @IsString()
  @IsNotEmpty({ message: 'Las observaciones son obligatorias' })
  observaciones: string;
}
