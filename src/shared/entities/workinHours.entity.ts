import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DoctorEntity } from "./doctors.entity";

@Entity()
export class WorkingHoursEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "jsonb", nullable: false })
  day: string;

  @Column({ type: "jsonb", nullable: false })
  time: {
    from: string;
    to: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => DoctorEntity, (doctor) => doctor.workinHours)
  @JoinColumn({ name: "doctorId" })
  doctor: DoctorEntity;
}
