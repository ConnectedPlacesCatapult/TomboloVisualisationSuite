import * as express from 'express';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {AuthService} from '../../lib/auth';

const logger = Container.get(LoggerService);
const authService = Container.get(AuthService);
const router = express.Router();

// Return route for email confirmation
router.get('/confirmemail', async (req, res, next) => {
  try {
    await authService.confirmEmail(req.query.token);
    res.redirect(req.query.redirect);
  }
  catch (e) {
    next(e);
  }
});

export default router;
