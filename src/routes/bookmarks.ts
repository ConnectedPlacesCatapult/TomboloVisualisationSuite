import * as express from 'express';
import {Container} from 'typedi';
import {LoggerService} from '../lib/logger';
import {Bookmark} from '../db/models/Bookmark';

const logger = Container.get(LoggerService);
const router = express.Router();

const base58 = require('base58');

//////////////////////
// Routes

/**
 * Get a bookmark
 */
router.get('/:base58Id', async (req, res, next) => {
  try {
    Bookmark.findOne({where: { id: base58.decode(req.params.base58Id) }}).then(bookmark => {
      res.redirect(bookmark['url']);
    });
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});

export default router;
