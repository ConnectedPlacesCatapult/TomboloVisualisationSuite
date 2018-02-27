import {Container, Service} from 'typedi';
import {Logger, LoggerService} from './logger';
import * as config from 'config';
import {Express} from 'express';
import * as passport from 'passport';
import {AuthenticateOptions} from 'passport';
import {User} from '../db/models/User';

const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;

function ServiceFactory() {
  let logger = Container.get(LoggerService);
  return new AuthService(logger, config.get('auth'));
}


@Service({factory: ServiceFactory})
export class AuthService {

  constructor(private logger: Logger, private options: any) {
  }


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

  authenticate(strategy: string, options?: AuthenticateOptions): any {
    return passport.authenticate(strategy, options, (err, user, info) => {
      this.logger.debug('auth', err, user, info);
    });
  }

  private localCallback(username: string, password: string, done) {
    this.logger.debug(`Logging in with username: ${username}, password: ${password}`);
  }

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
