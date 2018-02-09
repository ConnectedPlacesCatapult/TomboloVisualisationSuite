import {Column, DataType, Model, Table} from 'sequelize-typescript';

@Table({
  tableName: 'bookmarks',
  timestamps: false,
  version: false
})
export class Bookmark extends Model<Bookmark> {

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  url: string;

}
