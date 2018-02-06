import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Scopes, Table} from 'sequelize-typescript';
import * as sequelize from 'sequelize';

@Table({
  tableName: 'base_maps',
  timestamps: true,
  version: true
})
export class BaseMap extends Model<BaseMap> {

  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: sequelize.literal('uuid_generate_v4()')
  })
  id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description: string;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  style: object;

}
