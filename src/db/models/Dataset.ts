import {
  BelongsTo, Column, DataType, DefaultScope, ForeignKey, HasMany, Model, Scopes,
  Table
} from 'sequelize-typescript';
import {User} from './User';
import {DataAttribute} from './DataAttribute';
import {DatasetGroup} from './DatasetGroup';
import * as sequelize from 'sequelize';
import {QueryInterface} from 'sequelize';
import {ITomboloDataset} from '../../shared/ITomboloDataset';
import {ITomboloDatasetAttribute} from '../../shared/ITomboloDatasetAttribute';

type SourceType = 'table' | 'sql' | 'tilelive';

const CATEGORY_MAX_COUNT = 7;

@Table({
  tableName: 'datasets',
  timestamps: true,
  version: true
})
@Scopes({
  withAttributes: {
    order: [['dataAttributes', 'order']],
    include: [() => DataAttribute]
  }
})
export class Dataset extends Model<Dataset> implements ITomboloDataset {

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

  @Column({
    type: DataType.INTEGER,
    field: 'original_bytes'
  })
  originalBytes: number;

  @Column({
    type: DataType.INTEGER,
    field: 'db_bytes'
  })
  dbBytes: number;

  @Column({
    type: DataType.INTEGER()
  })
  order: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'owner_id'
  })
  ownerId: string;

  @ForeignKey(() => DatasetGroup)
  @Column({
    type: DataType.TEXT,
    field: 'dataset_group_id'
  })
  datasetGroupId: string;


  @BelongsTo(() => User, {onDelete: 'CASCADE'})
  owner: User;

  @HasMany(() => DataAttribute)
  dataAttributes: ITomboloDatasetAttribute[];

  // Find all datasets by userId
  static findByUserId(userId: string) {
    return Dataset.findAll<Dataset>({
      where: { ownerId: userId},
      order: ['name']
    });
  }

  // Find datasets by full-text query
  static findByFullTextQuery(query: string) {

    const queryInterface: QueryInterface = (this as any).QueryInterface;
    const sqlSafeQuery = queryInterface.escape(query);

    const fullTextQuery =
      `to_tsvector('english', name || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', ${sqlSafeQuery})`;

    return Dataset.findAll<Dataset>({
      where: {
        query: sequelize.literal(fullTextQuery)
      } as any,
      order: ['name']
    });
  }

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

  async calculateGeometryExtent(): Promise<void> {

    const extentSql = `
      select btrim(replace(st_extent(${this.sqlSafeGeometryColumn()})::text, ' ', ','), '(BOX()') as extent 
      from ${this.sqlSafeSource()}`;

    const result = await this.sequelize.query(extentSql, {type: sequelize.QueryTypes.SELECT});

    this.extent = result[0]['extent'].split(',').map(val => +val);

    await this.save();
  }

  async calculateDatasetBytes(): Promise<void> {

    if (this.sourceType !== 'table') return;

    const bytesSql = `SELECT pg_total_relation_size('${this.sqlSafeSource()}') as bytes`;

    const result = await this.sequelize.query(bytesSql, {type: sequelize.QueryTypes.SELECT});

    this.dbBytes = result[0]['bytes'];

    await this.save();
  }

  sqlSafeGeometryColumn() {
    return this.sequelize.getQueryInterface().quoteIdentifier(this.geometryColumn, true);
  }

  sqlSafeSource() {
    if (this.sourceType === 'table')
      return this.sequelize.getQueryInterface().quoteIdentifier(this.source, true);
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
