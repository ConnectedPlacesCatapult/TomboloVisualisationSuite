import {Column, DataType, HasMany, Model, Table, Unique} from 'sequelize-typescript';
import {Dataset} from './Dataset';
import * as sequelize from 'sequelize';
import {UserBase} from '../../shared/user-base';

@Table({
  tableName: 'users',
  timestamps: true,
  version: true
})
export class User extends Model<User> implements UserBase {

  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: sequelize.literal('uuid_generate_v4()')
  })
  id: string;

  @Column({
    type: DataType.TEXT,
    unique: true,
    allowNull: false,
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
    field: 'last_name'
  })
  lastName: string;

  @Column({
    type: DataType.TEXT
  })
  password: string;

  @Column({
    type: DataType.TEXT,
    field: 'facebook_id'
  })
  facebookId: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  newsletters: boolean;

  @Column({
    type: DataType.BOOLEAN,
    field: 'email_verified',
    defaultValue: false
  })
  emailVerified: boolean;

  @Column({
    type: DataType.UUID,
    field: 'verification_token'
  })
  verificationToken: string;

  @Column({
    type: DataType.UUID,
    field: 'password_reset_token'
  })
  passwordResetToken: string;

  @HasMany(() => Dataset)
  datasets: Dataset[];

  // Return representation safe for sending to client
  get clientSafeUser() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName
    };
  }
}
