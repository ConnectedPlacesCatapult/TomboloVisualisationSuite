import * as config from 'config';
import {Logger} from '../../src/lib/logger';
import {Container} from 'typedi';
import {DB} from '../../src/db/index';
import * as sequelize from 'sequelize';
import {AuthService} from '../../src/lib/auth';


describe('Authentication Service', () => {

  let authService: AuthService;
  const db =  Container.get(DB);

  const mockLocker: Logger = {
    log: (level: string, msg: string, ...meta: any[]) => {
    },
    silly: (msg: string, ...meta: any[]) => {
    },
    debug: (msg: string, ...meta: any[]) => {
    },
    info: (msg: string, ...meta: any[]) => {
    },
    warn: (msg: string, ...meta: any[]) => {
    },
    error: (msg: string, ...meta: any[]) => {
    }
  };


  beforeEach(() => {
    authService = new AuthService(mockLocker, config.get('auth'));
  });

  describe('Authentication Service', () => {

    it('should exist', () => {
      expect(authService).toBeDefined();
    });
  });

});
