declare module 'passport-gitlab2' {
  import { Strategy } from 'passport';
  export class Strategy extends Strategy {
    constructor(
      options: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope?: string[];
      },
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void,
      ) => void,
    );
  }
}
