import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import {User} from './User';

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
  ogrInfo: object;

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

  @BelongsTo(() => User)
  owner: User;
}
