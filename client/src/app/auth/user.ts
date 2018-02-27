import {UserBase} from '../../../../src/shared/user-base';

export class User implements UserBase {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  facebookId: string;
}
