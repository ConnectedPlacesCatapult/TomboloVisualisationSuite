import {UserBase} from '../../../../src/shared/user-base';

export class User implements UserBase {
  id: string;
  email: string;
  name: string;
  facebookId: string;
  twitterId: string;
}
