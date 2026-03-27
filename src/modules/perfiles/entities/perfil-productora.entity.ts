import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoIdentificacion } from '../../catalogos/entities/tipo-identificacion.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';

@Entity('perfiles_productora')
export class PerfilProductora {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario_id: number;

  @Column({ length: 100, nullable: true })
  primer_nombre: string;

  @Column({ length: 100, nullable: true })
  segundo_nombre: string;

  @Column({ length: 100, nullable: true })
  primer_apellido: string;

  @Column({ length: 100, nullable: true })
  segundo_apellido: string;

  @Column({ nullable: true })
  tipo_identificacion_id: number;

  @Column({ length: 50, nullable: true })
  numero_documento: string;

  @Column({ nullable: true })
  municipio_id: number;

  @Column({ length: 255, nullable: true })
  nombre_publico: string;

  @Column({ type: 'text', nullable: true })
  descripcion_empresa: string;

  @Column({ length: 255, nullable: true })
  sitio_web: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => TipoIdentificacion)
  @JoinColumn({ name: 'tipo_identificacion_id' })
  tipo_identificacion: TipoIdentificacion;

  @ManyToOne(() => Municipio)
  @JoinColumn({ name: 'municipio_id' })
  municipio: Municipio;
}
