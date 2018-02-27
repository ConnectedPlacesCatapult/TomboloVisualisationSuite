import * as express from 'express';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {AuthService} from '../../lib/auth';

const logger = Container.get(LoggerService);
const authService = Container.get(AuthService);
const router = express.Router();

router.post('/login', authService.localLogin);

router.get('/me', (req, res) => {
  if (!req.user) return res.status(404).send('Not logged in');
  res.json(req.user.clientSafeUser);
});

router.get('/logout', (req, res) => {
  req.logout();
  res.sendStatus(204);
});

export default router;
