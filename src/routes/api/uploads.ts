/**
 * Uploads Route - file upload handling
 *
 * @module Routes
 */

/**
 * Copyright © 2018 Emu Analytics
 */

import * as express from 'express';
import * as multer from 'multer';

const router = express.Router();
const upload = multer({
  dest: 'uploads/'
});

/**
 * Get client config
 */
router.get('/', (req, res) => {
  res.send('hello');
});

router.post('/', upload.single('file'), (req, res) => {
  res.json(req['file']);
});

export default router;
