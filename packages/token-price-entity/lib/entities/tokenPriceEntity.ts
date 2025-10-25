import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from '@rosen-bridge/extended-typeorm';

@Entity('token_price_entity')
export class TokenPriceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'bigint' })
  timestamp!: number;

  @Column({ type: 'varchar' })
  ergoSideTokenId!: string;

  @Column({ type: 'decimal', precision: 20, scale: 10 })
  price!: number;
}
