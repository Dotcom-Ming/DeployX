import { Strategy as GoogleStrategy } from "passport-google-oauth20";

export function createGoogleStrategy(
  clientId: string,
  clientSecret: string,
  callbackURL: string
): GoogleStrategy {
  return new GoogleStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ["profile", "email"],
    } as any,
    (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: (error: any, user?: any) => void
    ) => {
      return done(null, profile);
    }
  );
}
