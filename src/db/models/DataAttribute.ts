
import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table} from 'sequelize-typescript';
import {Dataset} from './Dataset';

@Table({
  tableName: 'data_attributes',
  timestamps: true,
  version: true
})
export class DataAttribute extends Model<DataAttribute> {

  @ForeignKey(() => Dataset)
  @Column({
    type: DataType.UUID,
    field: 'dataset_id',
    primaryKey: true
  })
  datasetId: string;

  @Column({
    type: DataType.TEXT,
    primaryKey: true
  })
  field: string;


  @Column({
    type: DataType.TEXT,
    field: 'field_sql'
  })
  fieldSql: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  type: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  name: string;

  @Column({
    type: DataType.TEXT
  })
  description: string;

  @Column({
    type: DataType.DOUBLE,
    field: 'min'
  })
  minValue: number;

  @Column({
    type: DataType.DOUBLE,
    field: 'max'
  })
  maxValue: number;

  @Column({
    type: DataType.ARRAY(DataType.DOUBLE),
    field: 'quantiles_5'
  })
  quantiles5: number[];

  @Column({
    type: DataType.ARRAY(DataType.DOUBLE),
    field: 'quantiles_10'
  })
  quantiles10: number[];

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
  })
  categories: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_categorical'
  })
  isCategorical: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_log'
  })
  isLog: boolean;

  @BelongsTo(() => Dataset)
  dataset: Dataset;

  // Instance methods
  //
  sqlSafeField(): string {
    if (this.fieldSql) {
      return this.fieldSql;
    }
    else {
      return `"${this.field}"`;
    }
  }
}
