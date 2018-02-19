import {Column, DataType, Model, Table} from 'sequelize-typescript';

@Table({
  tableName: 'palettes'
})
export class Palette extends Model<Palette> {

  @Column({
    type: DataType.TEXT,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.TEXT
  })
  description: string;

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    field: 'color_stops'
  })
  colorStops: string[];

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_default'
  })
  isDefault: boolean;

  static getDefault() {
    return Palette.findOne<Palette>({where: { isDefault: true} as any});
  }

}
