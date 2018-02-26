import * as express from 'express';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {AuthService} from '../../lib/auth';

const logger = Container.get(LoggerService);
const authService = Container.get(AuthService);
const router = express.Router();

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

export default router;
