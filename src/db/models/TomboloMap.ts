import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Scopes, Table} from 'sequelize-typescript';
import * as sequelize from 'sequelize';
import {User} from './User';
import {Dataset} from './Dataset';
import {DataAttribute} from './DataAttribute';
import {BaseMap} from './BaseMap';
import {TomboloMapLayer} from './TomboloMapLayer';
import {Palette} from './Palette';

@Table({
  tableName: 'maps',
  timestamps: true,
  version: true
})
@Scopes({
  full: {
    include: [
      () => User,
      () => BaseMap,
      {
        model: () => TomboloMapLayer,
        include: [() => Palette, {model: () => Dataset, include: [() => DataAttribute]}]
      }]
  }
})
export class TomboloMap extends Model<TomboloMap> {

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
    type: DataType.DOUBLE
  })
  zoom: number;

  @Column({
    type: DataType.ARRAY(DataType.DOUBLE)
  })
  center: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'owner_id'
  })
  ownerId: string;

  @ForeignKey(() => BaseMap)
  @Column({
    type: DataType.UUID,
    field: 'basemap_id'
  })
  basemapId: string;

  @HasMany(() => TomboloMapLayer)
  layers: TomboloMapLayer[];

  @BelongsTo(() => User)
  owner: User;

  @BelongsTo(() => BaseMap)
  basemap: BaseMap;
}
