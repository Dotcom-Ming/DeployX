import { Strategy as GitHubStrategy } from "passport-github2";

export function createGitHubStrategy(
  clientId: string,
  clientSecret: string,
  callbackURL: string
): GitHubStrategy {
  return new GitHubStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ["user:email", "read:org"],
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
