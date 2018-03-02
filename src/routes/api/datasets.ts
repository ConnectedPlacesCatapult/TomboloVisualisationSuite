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

    if (!dataset) {
      return next({status: 404, message: 'Dataset not found'});
    }

    res.json(dataset);
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.query.userId) {
      res.json(await Dataset.findByUserId(req.query.userId));
    }
    else if (req.query.query) {
      res.json(await Dataset.findByFullTextQuery(req.query.query));
    }
    else {
      next({status: 400, message: 'Must specify userId or query parameter'});
    }
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});

export default router;
