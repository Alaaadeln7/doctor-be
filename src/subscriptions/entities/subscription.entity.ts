import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoctorEntity } from '../../shared/entities/doctors.entity';
import { PlanEntity } from '../../shared/entities/plans.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'uuid', nullable: false })
  planId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: false })
  expireAt: Date;

  @Column({ type: 'varchar', nullable: true })
  typePlan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => DoctorEntity)
  @JoinColumn({ name: 'userId' })
  user: DoctorEntity;

  @ManyToOne(() => PlanEntity)
  @JoinColumn({ name: 'planId' })
  plan: PlanEntity;
}
