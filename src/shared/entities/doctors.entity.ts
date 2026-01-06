import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanEntity } from './plans.entity';
import { RequestEntity } from './requests.entity';
import { WorkingHoursEntity } from './workinHours.entity';
import { AppointmentEntity } from './appointments.entity';
import { CredentialEntity } from './credentials.entity';
import { CategoryEntity } from './categoris.entity';
import { Coupon } from '../../modules/coupons/entities/coupon.entity';

export interface FileClass {
  public_id: string;
  url: string;
}

@Entity()
@Check(`"email" ~* '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$'`)
@Check(`"phone" ~* '^(010|011|012|015)\\d{8}$'`)
export class DoctorEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  phone: string;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
    default:
      'https://res.cloudinary.com/djs3yabys/image/upload/v1767716324/general/general-img-defaultavatar.png-drs-am5e-drs-2026/1.png',
  })
  img: string;

  @Column({ type: 'jsonb', nullable: false })
  fullName: {
    fname: string;
    lname: string;
  };

  @Column({ type: 'jsonb', nullable: false })
  address: {
    governorate: string;
    center: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  code?: {
    code: string;
    count: number;
  };

  @OneToOne(() => Coupon, (coupon) => coupon.doctor)
  coupon: Coupon;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  views: {
    viewer: DoctorEntity | null;
    ip: string;
    date: Date;
  }[];

  @Column({ type: 'varchar', nullable: true })
  paymentImage: string;

  @Column({ type: 'varchar', nullable: true })
  favColor: string;

  @Column({
    type: 'varchar',
    nullable: true,
    default:
      'https://res.cloudinary.com/djs3yabys/image/upload/v1767716726/general/general-img-defaultbgdoctor.png-drs-9n0f-drs-2026/1.png',
  })
  backgroundImage: string;

  @Column({ type: 'jsonb', nullable: true })
  clinic: {
    name: string;
    description: string;
    phone?: string;
    whats?: string;
    landingPhone?: string;
    price?: number;
    rePrice?: number;
    paymentWay?: 'cash' | 'vesa' | 'bucket';
    address: {
      link: string;
      description?: string;
    };
    imgs?: FileClass[];
  };

  @Column({ type: 'jsonb', nullable: true })
  auth: {
    card: FileClass;
    id: {
      fid: FileClass;
    };
  };

  @Column({ type: 'varchar', nullable: false, default: '0' })
  syndicateNo: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'varchar', nullable: true })
  otp: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', nullable: true })
  lsUpBy: number;

  @ManyToOne(() => PlanEntity, (plan) => plan.doctors)
  plan: PlanEntity;

  @ManyToOne(() => CategoryEntity, (category) => category.doctors)
  category: CategoryEntity;

  @OneToMany(() => RequestEntity, (request) => request.doctor)
  requests: RequestEntity[];

  @OneToMany(() => WorkingHoursEntity, (workinHours) => workinHours.doctor)
  workinHours: WorkingHoursEntity[];

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.doctor)
  appointments: AppointmentEntity[];

  @OneToOne(() => CredentialEntity, (credential) => credential.doctor, {
    cascade: true,
  })
  @JoinColumn()
  credential: CredentialEntity;
}
