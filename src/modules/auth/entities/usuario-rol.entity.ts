import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Rol } from './rol.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('usuario_roles')
export class UsuarioRol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuario_id: number;

  @Column()
  rol_id: number;

  @CreateDateColumn()
  fecha_asignacion: Date;

  @Column({ nullable: true })
  asignado_por: number;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuario_roles)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'asignado_por' })
  asignado_por_usuario: Usuario;

  @ManyToOne(() => Rol, (rol) => rol.usuario_roles)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;
}
