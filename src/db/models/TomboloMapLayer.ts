import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {Dataset} from './Dataset';
import {TomboloMap} from './TomboloMap';
import {DATA_LAYER_ID} from '../../lib/tile-renderers/postgis-tile-renderer';
import {Palette} from './Palette';


@Table({
  tableName: 'map_layers',
  timestamps: true,
  version: true
})
export class TomboloMapLayer extends Model<TomboloMapLayer> {

  @ForeignKey(() => TomboloMap)
  @Column({
    type: DataType.UUID,
    field: 'map_id',

    primaryKey: true
  })
  mapId: string;

  @Column({
    type: DataType.TEXT,
    primaryKey: true,
    field: 'layer_id',
  })
  layerId: string;

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
    type: DataType.TEXT,
    field: 'layer_type'
  })
  layerType: string;

  @ForeignKey(() => Palette)
  @Column({
    type: DataType.TEXT,
    field: 'palette_id'
  })
  paletteId: string;

  @Column({
    type: DataType.BOOLEAN,
    field: 'palette_inverted'
  })
  paletteInverted: boolean;

  @ForeignKey(() => Dataset)
  @Column({
    type: DataType.UUID,
    field: 'dataset_id'
  })
  datasetId: string;

  @Column({
    type: DataType.TEXT,
    field: 'data_attribute'
  })
  datasetAttribute: string;

  @Column({
    type: DataType.TEXT,
    field: 'label_attribute'
  })
  labelAttribute: string;

  @Column({
    type: DataType.FLOAT,
    field: 'opacity'
  })
  opacity: string;

  @BelongsTo(() => Dataset)
  dataset: Dataset;

  @BelongsTo(() => Palette)
  palette: Palette;

  @BelongsTo(() => TomboloMap)
  map: TomboloMap;
}

