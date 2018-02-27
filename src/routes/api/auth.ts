import * as express from 'express';
import * as config from 'config';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {AuthService} from '../../lib/auth';

const logger = Container.get(LoggerService);
const authService = Container.get(AuthService);
const router = express.Router();

const baseUrl = config.get('server.baseUrl');

router.post('/login', authService.localLogin);

router.post('/signup', async (req, res, next) => {

  const email = req.body.email;
  const password = req.body.password;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const newsletters = req.body.newsletters;

  try {
    let user = await authService.localSignup(email, password, firstName, lastName, newsletters);
    user = await authService.sendSignupConfirmation(email, '/(loginBox:login)');

    res.json(user.clientSafeUser);
  }
  catch (e) {
    next(e);
  }
});

router.get('/me', (req, res) => {
  if (!req.user) return res.status(404).send('Not logged in');
  res.json(req.user.clientSafeUser);
});

router.get('/logout', (req, res) => {
  req.logout();
  res.sendStatus(204);
});

export default router;
