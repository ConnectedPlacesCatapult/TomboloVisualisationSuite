import {UserBase} from '../../../../src/shared/user-base';

export class User implements UserBase {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  facebookId: string;

  constructor(attributes: UserBase) {
    this.id = attributes.id;
    this.email = attributes.email;
    this.firstName = attributes.firstName;
    this.lastName = attributes.lastName;
    this.facebookId = attributes.facebookId;
  }

  get displayName() : string {
    return [this.firstName, this.lastName].map(s => s ? s : '').join(' ');
  }
}
