import {Column, DataType, HasMany, Model, Table, Unique} from 'sequelize-typescript';
import {Dataset} from './Dataset';
import * as sequelize from 'sequelize';

@Table({
  tableName: 'users',
  timestamps: true,
  version: true
})
export class User extends Model<User> {

  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: sequelize.literal('uuid_generate_v4()')
  })
  id: string;

  @Column({
    type: DataType.TEXT,
    unique: true,
    validate: {
      isEmail: true
    }
  })
  email: string;

  @Column({
    type: DataType.TEXT,
    field: 'first_name'
  })
  firstName: string;

 @Column({
    type: DataType.TEXT,
    field: 'last_name',
    allowNull: true
  })
  lastName: string;

  @Column({
    type: DataType.TEXT,
    field: 'facebook_id'
  })
  facebookId: string;

  @HasMany(() => Dataset)
  datasets: Dataset[];
}
