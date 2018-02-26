import * as express from 'express';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {AuthService} from '../../lib/auth';

const logger = Container.get(LoggerService);
const authService = Container.get(AuthService);
const router = express.Router();

router.get('/facebook', authService.authenticate('facebook', { scope: ['email']}));

router.get('/facebook/return', authService.authenticate(
  'facebook',
  {
    successRedirect: '/',
    failureRedirect: '/login'
  }));


export default router;
