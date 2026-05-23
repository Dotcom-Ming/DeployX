import { Strategy as GitLabStrategy } from "passport-gitlab2";

export function createGitLabStrategy(
  clientId: string,
  clientSecret: string,
  callbackURL: string
): GitLabStrategy {
  return new GitLabStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ["read_user", "openid"],
    },
    (
      accessToken: string,
      refreshToken: string,
      profile: Record<string, unknown>,
      done: (error: Error | null, user?: Record<string, unknown>) => void
    ) => {
      return done(null, profile as Record<string, unknown>);
    }
  );
}
