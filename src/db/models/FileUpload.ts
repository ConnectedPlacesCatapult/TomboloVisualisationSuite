import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {User} from './User';
import {DATATABLE_SUFFIX, OgrFileInfo} from '../../lib/file-ingester/file-ingester';
import {Dataset} from './Dataset';
import {TomboloMap} from './TomboloMap';

@Table({
  tableName: 'file_uploads',
  timestamps: true,
  version: true
})
export class FileUpload extends Model<FileUpload> {

  @Column({
    type: DataType.TEXT,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.TEXT,
    field: 'original_name'
  })
  originalName: string;

  @Column({
    type: DataType.TEXT,
    field: 'mime_type'
  })
  mimeType: string;

  @Column({
    type: DataType.INTEGER,
  })
  size: number;

  @Column({
    type: DataType.TEXT,
  })
  path: string;

  @Column({
    type: DataType.TEXT,
  })
  status: 'uploaded' | 'validating' | 'ingesting' | 'done' | 'error';

  @Column({
    type: DataType.JSON,
    field: 'ogr_info'
  })
  ogrInfo: OgrFileInfo;



  @Column({
    type: DataType.TEXT,
  })
  error: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'owner_id'
  })
  ownerId: string;

  @ForeignKey(() => Dataset)
  @Column({
    type: DataType.UUID,
    field: 'dataset_id'
  })
  datasetId: string;

  @ForeignKey(() => TomboloMap)
  @Column({
    type: DataType.UUID,
    field: 'map_id'
  })
  mapId: string;

  @BelongsTo(() => User, {onDelete: 'CASCADE'})
  owner: User;

  @BelongsTo(() => Dataset, {onDelete: 'SET NULL'})
  dataset: Dataset;

  @BelongsTo(() => TomboloMap, {onDelete: 'SET NULL'})
  map: TomboloMap;

  tableName() {
    return this.id + DATATABLE_SUFFIX;
  }

  sqlSafeTableName() {
    return this.sequelize.getQueryInterface().quoteIdentifier(this.tableName(), true);
  }

  sqlSafeAttributeColumn(column: string) {
    return this.sequelize.getQueryInterface().quoteIdentifier(column, true);
  }

  attributeType(attrId: string): string | null {
    const attr = this.ogrInfo.attributes.find(attr => attr.id === attrId);
    return attr ? attr.type : null;
  }
}
