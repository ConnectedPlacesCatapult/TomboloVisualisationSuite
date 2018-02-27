import {Container, Service} from 'typedi';
import * as crypto from 'crypto';
import {Logger, LoggerService} from './logger';
import * as config from 'config';
import {Express} from 'express';
import * as passport from 'passport';
import {AuthenticateOptions} from 'passport';
import {User} from '../db/models/User';
import {UniqueConstraintError} from 'sequelize';
import {Mailer} from './mailer';
import * as uuidv4 from 'uuid/v4';

const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;

export class AuthenticationError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);

    // Set the prototype explicitly - required in Typescript when extending a built-in like Error
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * AuthenticationService configuration object
 */
export interface AuthenticationServiceConfig {
  hashBytes?: number;
  saltBytes?: number;
  iterations?: number;
  secret?: string;
}

function ServiceFactory() {
  const logger = Container.get(LoggerService);
  const mailer = Container.get(Mailer);

  return new AuthService(logger, mailer, config.get('auth'));
}


@Service({factory: ServiceFactory})
export class AuthService {

  static defaultConfig: AuthenticationServiceConfig = {

    // size of the generated hash
    hashBytes: 32,
    // larger salt means hashed passwords are more resistant to rainbow table, but
    // you get diminishing returns pretty fast
    saltBytes: 16,
    // more iterations means an attacker has to take longer to brute force an
    // individual password, so larger is better. however, larger also means longer
    // to hash the password. tune so that hashing the password takes about a
    // second
    iterations: 500000,

    // Encryption secret
    secret: 'changethis!'
  };

  config: AuthenticationServiceConfig;

  constructor(private logger: Logger, private mailer: Mailer, private options: any) {
    this.config = {...AuthService.defaultConfig, ...options};
  }

  /* Call at app startup to initialize passport */
  init(app: Express) {

    passport.use(new LocalStrategy({

      }, this.localCallback.bind(this)));

    passport.use(new FacebookStrategy({
      clientID: this.options.facebook.clientId,
      clientSecret: this.options.facebook.clientSecret,
      callbackURL: this.options.facebook.callback,
      profileFields: ['id', 'email', 'first_name', 'last_name']
    }, this.facebookCallback.bind(this)));

    passport.serializeUser((user: User, done) => {
      this.logger.info('Serializing user');
      done(null, user.id);
    });

    passport.deserializeUser((id: string, done) => {
      this.logger.info('Deserializing user');
      User.findById(id)
        .then(user => done(null, user))
        .catch(e => done(e));
    });

    app.use(passport.initialize());
    app.use(passport.session());
  }

  // Middleware function to perform a local login
  localLogin(req, res, next) {
    passport.authenticate('local', function(err, user, info) {

      if (err) return next(err);

      if (!user) return next({status: 401, message: 'Not authorised'});

      req.logIn(user, err => {
        if (err) return next(err);

        return res.json(user.clientSafeUser);
      });

    })(req, res, next);
  }

  async localSignup(email: string, password: string, firstName: string, lastName, newsletters: boolean): Promise<User> {

    if (!password) throw new AuthenticationError('Password must not be null');

    try {
      const encryptedPassword = await this.encryptPassword(password);
      const user = await User.create<User>({
        email,
        password: encryptedPassword,
        firstName,
        lastName,
        newsletters
      });

      return user;
    }
    catch (e) {
      if (e instanceof UniqueConstraintError) {
        throw new AuthenticationError(`User with email ${email} is already registered`);
      }

      if (e.name === 'SequelizeValidationError') {
        throw new AuthenticationError(e.message);
      }

      // Unrecognised error - rethrow
      this.logger.error('Signup error', e);
      throw e;
    }
  }

  /**
   * Send signup confirmation email with verification link
   *
   * @param {string} email - email of user to send link to
   * @param {string} redirectUrl - relative url to redirect to once verification has occured
   */
  async sendSignupConfirmation(email: string, redirectUrl: string): Promise<User> {
    let user = await User.findOne<User>({where: {email}});

    if (!user) {
      throw new AuthenticationError('User not found', 500);
    }

    const verificationToken = uuidv4();

    user = await user.update({verificationToken: verificationToken});

    const context = {
      user,
      redirectUrl
    };

    await this.mailer.sendMail(user.email, 'Welcome to Tombolo!', 'confirmation.html', context);

    return user;
  }

  /**
   * Verify user email address using verification token supplied in sign-up email
   *
   * @param {string} token
   * @returns {Promise<User>}
   */
  async confirmEmail(token: string): Promise<User> {
    let user = await User.findOne<User>({where: {verificationToken: token}});

    if (!user) {
      throw new AuthenticationError('Verification token not found');
    }

    return await user.update({emailVerified: true, verificationToken: null});
  }

  authenticate(strategy: string, options?: AuthenticateOptions): any {
    return passport.authenticate(strategy, options, (err, user, info) => {
      this.logger.debug('auth', err, user, info);
    });
  }

  /**
   * Encrypt a password using salt+pbkdf2/sha256 algorithm
   */
  encryptPassword(password: string): Promise<string> {

    return new Promise((resolve, reject) => {

      // generate a salt for pbkdf2
      crypto.randomBytes(this.config.saltBytes, (err, salt) => {
        if (err) {
          reject(err);
        }

        crypto.pbkdf2(password, salt, this.config.iterations, this.config.hashBytes, 'sha256',
          (err, hash) => {

            if (err) {
              return reject(err);
            }

            let combined = new Buffer(hash.length + salt.length + 8);

            // include the size of the salt so that we can, during verification,
            // figure out how much of the hash is salt
            combined.writeUInt32BE(salt.length, 0, true);
            // similarly, include the iteration count
            combined.writeUInt32BE(this.config.iterations, 4, true);

            salt.copy(combined, 8);
            hash.copy(combined, salt.length + 8);
            resolve(combined.toString('base64'));
          });
      });
    });
  }

  /**
   * Verify an encrypted password
   */
  validatePassword(password, encryptedPassword): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // extract the salt and hash from the combined buffer
      const encryptedBuffer = new Buffer(encryptedPassword, 'base64');
      const saltBytes = encryptedBuffer.readUInt32BE(0);
      const hashBytes = encryptedBuffer.length - saltBytes - 8;
      const iterations = encryptedBuffer.readUInt32BE(4);
      const salt = encryptedBuffer.slice(8, saltBytes + 8);
      const hash = encryptedBuffer.toString('binary', saltBytes + 8);

      // verify the salt and hash against the password
      crypto.pbkdf2(password, salt, iterations, hashBytes, 'sha256', (err, verify) => {
        if (err) {
          reject(err);
        }

        resolve(verify.toString('binary') === hash);
      });
    });
  }

  /**
   * Passport callback for local strategy
   *
   * @param {string} username
   * @param {string} password
   * @param done
   */
  private localCallback(username: string, password: string, done) {

    User.findOne<User>({where: {email: username}})
      .then(user => {

        if (!user) return done(null, false);

        return this.validatePassword(password, user.password).then(valid => {
          if (!valid) return done(null, false);
          done(null, user);
        });
      })
      .catch(e => done(e));
  }

  /**
   * Passport callback for Facebook strategy
   *
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param done
   */
  private facebookCallback(accessToken, refreshToken, profile, done) {

    this.logger.info(profile);

    const email = profile.emails[0].value;

    return User.findOrCreate<User>({
      where: {
        email: email
      },
      defaults: {
        facebookId: profile.id,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: email
      }
    })
      .spread((user: User, created) => {
        if (created) {
          // New user created
          return done(null, user);
        }
        else {
          // User already registered - associate FB id
          if (!user.facebookId) {
            user.facebookId = profile.id;
            return user.save().then(user => {
              return done(null, user);
            });
          }
        }
      })
      .catch(e => done(e));
  }
}
