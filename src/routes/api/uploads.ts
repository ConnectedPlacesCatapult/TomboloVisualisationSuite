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
import * as config from 'config';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {FileUpload} from '../../db/models/FileUpload';
import {FileIngester} from '../../lib/file-uploader/file-injester';

const logger = Container.get(LoggerService);
const fileUploader = Container.get(FileIngester);

const router = express.Router();

const upload = multer({
  dest: config.get('fileUpload.uploadPath'),
  limits: {
    files: 1,
    fileSize: config.get('fileUpload.maxFileSize')
  }
} as any);

/**
 * Get client config
 */
router.get('/', (req, res) => {
  res.send('hello');
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;

    const fileUpload = await FileUpload.create<FileUpload>({
      id: file.filename,
      mimeType: file.mimetype,
      originalName: file.originalname,
      size: file.size,
      path: file.path,
      status: 'uploaded'
    });

    // Do not wait for processing to finish.
    // Processing will continue after this route returns
    fileUploader.processFile(fileUpload);

    res.json(fileUpload);
  }
  catch (e) {
    logger.error(e);
    next(e);
  }
});

export default router;
