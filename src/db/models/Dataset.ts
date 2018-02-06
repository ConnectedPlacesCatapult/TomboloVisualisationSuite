import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table} from 'sequelize-typescript';
import {User} from './User';
import {DataAttribute} from './DataAttribute';
import * as sequelize from 'sequelize';

type SourceType = 'table' | 'sql' | 'tilelive';

const CATEGORY_MAX_COUNT = 7;

@Table({
  tableName: 'datasets',
  timestamps: true,
  version: true
})
export class Dataset extends Model<Dataset> {

  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true
  })
  id: string;

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
    type: DataType.TEXT
  })
  attribution: string;

  @Column({
    type: DataType.TEXT,
    validate: {
      isIn: [['table', 'sql', 'tilelive']]
    }
  })
  sourceType: SourceType;

  @Column(DataType.TEXT)
  source: string;

  @Column({
    type: DataType.TEXT,
    defaultValue: 'geometry',
    field: 'geometry_column'
  })
  geometryColumn: string;

  @Column({
    type: DataType.TEXT,
    field: 'geometry_type'
  })
  geometryType: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_private'
  })
  isPrivate: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      isInt: true
    }
  })
  minZoom: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 20,
    allowNull: false,
    validate: {
      isInt: true
    }
  })
  maxZoom: number;

  @Column({
    type: DataType.ARRAY(DataType.DOUBLE),
    defaultValue: [-180, -90, 180, 90]
  })
  extent: number[];

  @Column(DataType.JSON)
  headers: object;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'owner_id'
  })
  ownerId: string;

  @BelongsTo(() => User)
  owner: User;

  @HasMany(() => DataAttribute)
  dataAttributes: DataAttribute[];

  async calculateDataAttributeStats(): Promise<void> {
    // Calculating attribute stats is only supported for 'table' and 'sql' type datasets
    if (this.sourceType !== 'table' && this.sourceType !== 'sql') return;

    const dataAttributes = await this.$get('dataAttributes') as DataAttribute[];

    await Promise.all(dataAttributes.map(attribute => {
      if (attribute.type === 'number') {
        return this.updateNumericAttribute(attribute);
      }
      else if (attribute.type === 'string') {
        return this.updateTextualAttribute(attribute);
      }
    }));
  }

  sqlSafeSource() {
    if (this.sourceType === 'table')
      return `"${this.source}"`;
    else
      return this.source;
  }

  private async updateNumericAttribute(attribute: DataAttribute): Promise<void> {

    attribute.isCategorical = false;

    // Min and max values
    const minmaxSql = `select min(${attribute.sqlSafeField()}) as min, 
      max(${attribute.sqlSafeField()}) as max 
      from ${this.sqlSafeSource()}`;

    const minmax = await this.sequelize.query(minmaxSql, {type: sequelize.QueryTypes.SELECT});
    attribute.minValue = minmax[0].min;
    attribute.maxValue = minmax[0].max;

    const ntileSql = `select min(val), max(val), ntile from (
          select ${attribute.sqlSafeField()} as val, ntile($1) OVER(order by ${attribute.sqlSafeField()}) 
          from ${this.sqlSafeSource()} 
          where ${attribute.sqlSafeField()} notnull) as subquery
          group by ntile order by ntile;`;

    // Quintiles
    const quintiles = await this.sequelize.query(ntileSql, {type: sequelize.QueryTypes.SELECT, bind: [4]});
    attribute.quantiles5 = [...quintiles.map(d => d.min), attribute.maxValue];

    // Dectiles
    const dectiles = await this.sequelize.query(ntileSql, {type: sequelize.QueryTypes.SELECT, bind: [9]});
    attribute.quantiles10 = [...dectiles.map(d => d.min), attribute.maxValue];

    await attribute.save();
  }

  private async updateTextualAttribute(attribute: DataAttribute): Promise<void> {
    attribute.minValue = null;
    attribute.maxValue = null;
    attribute.quantiles5 = null;
    attribute.quantiles10 = null;

    // See if field is categorical (i.e. has distinct values less than CATEGORY_MAX_COUNT)
    const categoriesSql = `select distinct ${attribute.sqlSafeField()} as val 
      from ${this.sqlSafeSource()} order by 1 limit ${CATEGORY_MAX_COUNT + 1}`;

    const results = await this.sequelize.query(categoriesSql, {type: sequelize.QueryTypes.SELECT});

    if (results.length <= CATEGORY_MAX_COUNT) {
      attribute.isCategorical = true;
      attribute.categories = results.map(d => d.val);
    }
    else {
      attribute.isCategorical = false;
    }

    await attribute.save();
  }
}
