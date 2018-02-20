import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Scopes, Table} from 'sequelize-typescript';
import * as sequelize from 'sequelize';
import {literal} from 'sequelize';

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
    type: DataType.BOOLEAN,
    field: 'is_default'
  })
  isDefault: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  style: object;

  static getDefault() {
    return BaseMap.findOne<BaseMap>({where: { isDefault: true} as any});
  }

}
