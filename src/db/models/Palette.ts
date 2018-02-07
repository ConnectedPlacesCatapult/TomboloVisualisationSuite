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


}
