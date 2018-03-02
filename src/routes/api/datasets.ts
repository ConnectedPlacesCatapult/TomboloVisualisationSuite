import * as express from 'express';
import * as config from 'config';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {DatasetGroup} from '../../db/models/DatasetGroup';
import {Dataset} from '../../db/models/Dataset';
import {Sequelize} from 'sequelize-typescript';
import {DB} from '../../db';
import {IDatasetGroup} from '../../shared/IDatasetGroup';

const logger = Container.get(LoggerService);
const router = express.Router();
const sequelize = Sequelize;
const db = Container.get(DB);

// Tile server config options
const baseUrl = config.get('server.baseUrl');

router.get('/groups', async (req, res, next) => {
  try {
    const datasetGroups = await DatasetGroup.scope('full').findAll<DatasetGroup>();
    res.json(datasetGroups);
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});

router.get('/groups/:groupId', async (req, res, next) => {
  try {
    const datasetGroups = await DatasetGroup.scope('full').findById<DatasetGroup>(req.params.groupId);
    res.json(datasetGroups);
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});

router.get('/:datasetId', async (req, res, next) => {
  try {
    const dataset = await Dataset.findById<Dataset>(req.params.datasetId);
    res.json(dataset);
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  let searchQuery;
  let searchTerm;

  if (req.query.query) {
    searchQuery = `SELECT name FROM datasets WHERE to_tsvector('english', name || ' ' || coalesce(description, '')) 
      @@ plainto_tsquery('english', ?) LIMIT 10;`;
    searchTerm = req.query.query;
  } else if (req.query.userId) {
    searchQuery = `SELECT name FROM datasets WHERE owner_id = ? LIMIT 10;`;
    searchTerm = req.query.userId;
  } else {
    res.send('Must specify query or userId.');
    return;
  }

  db.sequelize.query(
    searchQuery,
    {replacements: [searchTerm], type: sequelize.QueryTypes.SELECT}
  ).then(datasetNames => {
    const namesArray = datasetNames.map(datasetName => datasetName.name);
    res.json(namesArray);
  }).catch(e => {
    logger.error(e);
    next(e);
  });
});

export default router;
