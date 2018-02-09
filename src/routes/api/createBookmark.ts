import * as express from 'express';
import * as config from 'config';
import {Bookmark} from '../../db/models/Bookmark';

const router = express.Router();
const base58 = require('base58');

//////////////////////
// Routes

/**
 * Post a bookmark
 */
router.post('/', async (req, res, next) => {
  const fullUrl = req.body.url;
  Bookmark.create({url: fullUrl}).then((r) => {
    const id = r.id;
    res.send({shortId: base58.encode(id)});
  });
});

export default router;
