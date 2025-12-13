import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GovernorateEntity } from './governorate.entity';

@Entity('city')
export class CityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: false })
  governorate_id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  city_name_ar: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  city_name_en: string;

  @ManyToOne(() => GovernorateEntity)
  @JoinColumn({ name: 'governorate_id' })
  governorate: GovernorateEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
