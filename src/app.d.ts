// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      session: {
        token: string;
        account: {
          id: string;
          name: string;
          primaryEmail: string;
          primaryEmailId: string;
        };
      } | null;
      deviceId: string;
    }
  }
}

export {};
