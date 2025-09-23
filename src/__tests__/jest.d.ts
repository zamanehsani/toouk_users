// Jest type declarations for tests
import 'jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperty(property: string, value?: any): R;
      toHaveLength(length: number): R;
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toBeDefined(): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
    }
  }
}
