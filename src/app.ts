/**
 * Tombolo Viewer App
 *
 */

/**
 * Copyright © 2018 Emu Analytics
 */

import 'reflect-metadata';
import * as express from 'express';
import * as morgan from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as boolParser from 'express-query-boolean';
import * as jwt from 'express-jwt';
import * as config from 'config';
import * as exphbs from 'express-handlebars';
import * as path from 'path';
import * as cors from 'cors';
import * as compression from 'compression';
import * as expressJwtPermissions from 'express-jwt-permissions';

import {Container} from 'typedi';
import {LoggerService} from './lib/logger';
import {DB} from './db';

// Router imports
import ConfigRouter from './routes/api/config';
import TilesRouter from './routes/tiles';
import MapsRouter from './routes/maps';
import CreateBookmarkRouter from './routes/api/createBookmark';
import BookmarksRouter from './routes/bookmarks';

import {TileRendererService} from './lib/tile-renderers/tile-renderer-service';
import {TileliveTileRenderer} from './lib/tile-renderers/tilelive-tile-renderer';
import {PostgisTileRenderer} from './lib/tile-renderers/postgis-tile-renderer';


const logger = Container.get(LoggerService);
const tileRendererService = Container.get(TileRendererService);
const app = express();
const guard = expressJwtPermissions();

// Configure Handlebars views
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//////////////////////////////////////////////////////////////////////////
// Configure Morgan http request logger
// Only used for dev - in production, NGINX logging is used

if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

//////////////////////////////////////////////////////////////////////////
// Register other middleware
app.use(cors(config.get('cors')));
app.use(express.static(path.join(__dirname, '../client-dist')));
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(boolParser());
app.use(cookieParser());
app.use(compression());
app.use(jwt({
  secret: config.get('jwt.secret'),
  credentialsRequired: false
}));


//////////////////////////////////////////////////////////////////////////
// Register Routes
app.use('/api/v1/config', ConfigRouter);
app.use('/api/v1/createBookmark', CreateBookmarkRouter);
app.use('/tiles', TilesRouter);
app.use('/maps', MapsRouter);
app.use('/b', BookmarksRouter);

// Redirect to index.html for Angular routes
app.get('/[^\.]+$', function(req, res){
  let indexFile = path.join(__dirname, '../client-dist/index.html');
  res.set('Content-Type', 'text/html').sendFile(indexFile);
});

// catch not handled and return 404
app.use((req, res, next) => next({
  message: 'Not Found',
  status: 404,
  stack: (new Error()).stack
}));

///////////////////////////////////////////////////////////
// Error handlers

// development error handler - will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    if (isApi(req)) {
      res.json({success: false, message: err.message, error: err});
    } else {
      res.render('error', {message: err.message, error: err, layout: false});
    }
  });
}

// production error handler - no stack-traces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  if (isApi(req)) {
    res.json({success: false, error: err});
  } else {
    res.render('error', {message: err.message, error: {}, layout: false});
  }
});

function isApi(req) {
  return req.url.indexOf('/api/v1/') === 0;
}

export = app;

//////////////////////////////////////////////////////////////////////////
// Register Tile Renderers
const postgisTileRenderer = new PostgisTileRenderer(logger, config.get('mapnik'));
const tileliveTileRenderer = new TileliveTileRenderer(logger);
tileRendererService.registerRenderer(['table', 'sql'], postgisTileRenderer);
tileRendererService.registerRenderer(['tilelive'], tileliveTileRenderer);

//////////////////////////////////////////////////////////////////////////
// Check DB
Container.get(DB).checkConnection()
  .catch(e => {
    logger.error('Could connect to database', e);
    process.exit(1);
  });

//////////////////////////////////////////////////////////////////////////
// SIGINT handler - exit cleanly
process.on('SIGINT',  function() {
  logger.info('Received SIGINT - shutting down');
  try {
    Container.get(DB).close();
    tileRendererService.close();
    setTimeout(() => process.exit(0), 500);
  }
  catch (e) {
    logger.error('Error on shutdown', e);
    process.exit(1);
  }
});
