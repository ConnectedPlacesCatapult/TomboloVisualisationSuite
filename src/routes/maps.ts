import * as express from 'express';
import * as config from 'config';

import {Container} from 'typedi';
import {LoggerService} from '../lib/logger';
import {TomboloMap} from '../db/models/TomboloMap';
import {StyleGenerator} from '../lib/style-generator';

const logger = Container.get(LoggerService);
const styleGenerator = Container.get(StyleGenerator);
const router = express.Router();

// Tile server config options
const baseUrl = config.get('server.baseUrl');

//////////////////////
// Routes

router.get('/', async (req, res, next) => {
  try {
    const maps = await TomboloMap.findAll<TomboloMap>({order: ['name']});
    const results = maps.map(map => ({
      id: map.id,
      name: map.name,
      description: map.description,
      icon: map.icon,
      styleUrl: `${baseUrl}/maps/${map.id}/style.json`
    }));

    res.json(results);
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});

/**
 * Get a map style
 */
router.get('/:mapId/style.json', async (req, res, next) => {
  try {
    const map = await TomboloMap.scope('full').findById<TomboloMap>(req.params.mapId);

    if (!map) {
      return next({status: 404, message: 'Map not found'});
    }

    res.json(styleGenerator.generateMapStyle(map, baseUrl + '/tiles/'));
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});


export default router;
