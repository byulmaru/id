import { error } from '@sveltejs/kit';

export const first = <T>(arr: T[]): T | undefined => arr[0];
export const firstOrThrow = <T>(arr: T[]): T => {
  if (arr.length === 0) {
    throw error(404, 'Not Found');
  }

  return arr[0];
};

export const firstOrThrowWith = (errorMaker: () => Error) =>
  <T>(arr: T[]): T => {
    if (arr.length === 0) {
      throw errorMaker();
    }

    return arr[0];
  };
