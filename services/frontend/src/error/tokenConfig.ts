import { AppError } from './app';

export class TokenConfigMissing extends AppError {
  constructor() {
    super('Token config was not found in backend service tokens config');
  }
}
