import {Column, DataType, Model, Table} from 'sequelize-typescript';
const base58 = require('base58');

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

  get shortId() {
    return base58.encode(this.id);
  }

  static findByShortId(shortId: number) {
    return Bookmark.findOne<Bookmark>({where: { id: base58.decode(shortId)}});
  }
}
