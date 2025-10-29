import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from '@rosen-bridge/extended-typeorm';

@Entity('token_price_entity')
export class TokenPriceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  timestamp: number;

  @Column({ type: 'varchar' })
  ergoSideTokenId: string;

  @Column({ type: 'float' })
  price: number;
}
