import * as express from 'express';
import * as config from 'config';
import {Container} from 'typedi';
import {LoggerService} from '../../lib/logger';
import {AuthService} from '../../lib/auth';

const logger = Container.get(LoggerService);
const authService = Container.get(AuthService);
const router = express.Router();

const baseUrl = config.get('server.baseUrl');

// Login route
router.post('/login', authService.localLogin);

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.sendStatus(204);
});

// Get logged-in user
router.get('/me', (req, res) => {
  if (!req.user) return res.status(404).send('Not logged in');
  res.json(req.user.clientSafeUser);
});

// Signup route
router.post('/signup', async (req, res, next) => {

  const email = req.body.email;

  try {
    let user = await authService.localSignup(req.body);
    user = await authService.sendSignupConfirmation(email, '/view(loginBox:login)');

    res.json(user.clientSafeUser);
  }
  catch (e) {
    next(e);
  }
});

// Reset route - send reset password email
router.post('/resetpassword', async (req, res, next) => {

  const email = req.body.email;

  try {
    const user = await authService.sendPasswordReset(email, '/view(loginBox:changepassword)');
    res.json(user.clientSafeUser);
  }
  catch (e) {
    next(e);
  }
});

// Change password - requires token from 'reset password' email
router.post('/changepassword', async (req, res, next) => {

  const email = req.body.email;
  const password = req.body.password;
  const token = req.body.token;

  try {
    const user = await authService.changePassword(email, password, token);
    res.json(user.clientSafeUser);
  }
  catch (e) {
    next(e);
  }
});

// Return route for signup confirmation
router.get('/confirmesignup', async (req, res, next) => {
  try {
    await authService.confirmSignup(req.query.token);
    res.redirect(req.query.redirect);
  }
  catch (e) {
    next(e);
  }
});

// Return route for password reset
router.get('/confirmreset', async (req, res, next) => {
  // Add token to redirect url
  res.redirect(req.query.redirect + '?token=' + req.query.token);
});

export default router;
