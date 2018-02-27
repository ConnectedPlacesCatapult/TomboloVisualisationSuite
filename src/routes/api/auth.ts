import * as express from 'express';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {AuthService} from '../../lib/auth';
import * as passport from 'passport';

const logger = Container.get(LoggerService);
const authService = Container.get(AuthService);
const router = express.Router();

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/users/' + user.username);
    });
  })(req, res, next);
});

export default router;
