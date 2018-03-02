import * as express from 'express';
import * as config from 'config';

import {Container} from 'typedi';
import {LoggerService} from '../lib/logger';
import {TomboloMap} from '../db/models/TomboloMap';
import {StyleGenerator} from '../lib/style-generator';
import {MapGroup} from '../db/models/MapGroup';

const logger = Container.get(LoggerService);
const styleGenerator = Container.get(StyleGenerator);
const router = express.Router();

// Tile server config options
const baseUrl = config.get('server.baseUrl');

//////////////////////
// Routes

router.get('/', async (req, res, next) => {
  try {

    // Get system map groups
    const mapGroups = await MapGroup.scope('systemMaps').findAll<MapGroup>();

    let results = mapGroups.map(group => ({
      id: group.id,
      name: group.name,
      order: group.order,
      maps: group.maps.map(clientSafeMap)
    }));

    // Get user's maps
    if (req.user) {
      const userMaps = await TomboloMap.findAll<TomboloMap>({where: {ownerId: req.user.id}});

      const userGroup = {
        id: 'usergroup',
        name: 'My Maps',
        order: 99,
        maps: userMaps.map(clientSafeMap)
      };

      results.push(userGroup);
    }

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

////////////////
// Route helpers

function clientSafeMap(map: TomboloMap): object {
  return {
    id: map.id,
    name: map.name,
    description: map.description,
    icon: map.icon,
    order: map.order,
    styleUrl: `${baseUrl}/maps/${map.id}/style.json`
  };
}

export default router;
