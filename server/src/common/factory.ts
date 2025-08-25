import { v4 } from 'uuid';

export abstract class Factory<T, U> {
  abstract create(params: Partial<U>): T;
  abstract reconstitute(params: U): T;

  protected generateId(): string {
    return v4();
  }
}
