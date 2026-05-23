declare module 'passport-github2' {
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

declare module 'passport-google-oauth20' {
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
