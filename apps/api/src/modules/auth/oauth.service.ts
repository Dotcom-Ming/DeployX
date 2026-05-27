export class OAuthService {
  private readonly githubClientId = process.env.GITHUB_CLIENT_ID || '';
  private readonly githubClientSecret = process.env.GITHUB_CLIENT_SECRET || '';
  private readonly githubCallbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3006/api/auth/oauth/github/callback';

  private readonly gitlabClientId = process.env.GITLAB_CLIENT_ID || '';
  private readonly gitlabClientSecret = process.env.GITLAB_CLIENT_SECRET || '';
  private readonly gitlabCallbackUrl = process.env.GITLAB_CALLBACK_URL || 'http://localhost:3006/api/auth/oauth/gitlab/callback';
  private readonly gitlabBaseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';

  private readonly googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  private readonly googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  private readonly googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3006/api/auth/oauth/google/callback';

  getAuthorizationUrl(provider: string, state: string): string {
    switch (provider) {
      case 'github':
        return `https://github.com/login/oauth/authorize?client_id=${this.githubClientId}&redirect_uri=${encodeURIComponent(this.githubCallbackUrl)}&scope=user:email,read:org&state=${state}`;
      case 'gitlab':
        return `${this.gitlabBaseUrl}/oauth/authorize?client_id=${this.gitlabClientId}&redirect_uri=${encodeURIComponent(this.gitlabCallbackUrl)}&response_type=code&scope=read_user+openid&state=${state}`;
      case 'google':
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.googleClientId}&redirect_uri=${encodeURIComponent(this.googleCallbackUrl)}&response_type=code&scope=openid+profile+email&state=${state}`;
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  async exchangeCodeForToken(provider: string, code: string): Promise<string> {
    let tokenUrl: string;
    let body: Record<string, string>;

    switch (provider) {
      case 'github':
        tokenUrl = 'https://github.com/login/oauth/access_token';
        body = {
          client_id: this.githubClientId,
          client_secret: this.githubClientSecret,
          code,
          redirect_uri: this.githubCallbackUrl,
        };
        break;
      case 'gitlab':
        tokenUrl = `${this.gitlabBaseUrl}/oauth/token`;
        body = {
          client_id: this.gitlabClientId,
          client_secret: this.gitlabClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.gitlabCallbackUrl,
        };
        break;
      case 'google':
        tokenUrl = 'https://oauth2.googleapis.com/token';
        body = {
          client_id: this.googleClientId,
          client_secret: this.googleClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.googleCallbackUrl,
        };
        break;
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    return data.access_token;
  }

  async fetchUserProfile(provider: string, accessToken: string): Promise<Record<string, unknown>> {
    switch (provider) {
      case 'github':
        return this.fetchGitHubProfile(accessToken);
      case 'gitlab':
        return this.fetchGitLabProfile(accessToken);
      case 'google':
        return this.fetchGoogleProfile(accessToken);
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  private async fetchGitHubProfile(accessToken: string): Promise<Record<string, unknown>> {
    const [userResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'DeployX' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'DeployX' },
      }),
    ]);

    const profile = await userResponse.json() as any;

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
      profile.emails = emails.map((e) => ({ value: e.email, primary: e.primary, verified: e.verified }));
    } else {
      profile.emails = profile.email ? [{ value: profile.email, primary: true, verified: true }] : [];
    }

    return {
      id: String(profile.id),
      displayName: profile.name || profile.login,
      emails: profile.emails,
      photos: profile.avatar_url ? [{ value: profile.avatar_url }] : [],
      provider: 'github',
    };
  }

  private async fetchGitLabProfile(accessToken: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.gitlabBaseUrl}/api/v4/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await response.json() as any;

    return {
      id: String(profile.id),
      displayName: profile.name || profile.username,
      emails: [{ value: profile.email, primary: true, verified: !!profile.confirmed_at }],
      photos: profile.avatar_url ? [{ value: profile.avatar_url }] : [],
      provider: 'gitlab',
    };
  }

  private async fetchGoogleProfile(accessToken: string): Promise<Record<string, unknown>> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await response.json() as any;

    return {
      id: String(profile.id),
      displayName: profile.name,
      emails: [{ value: profile.email, primary: true, verified: profile.verified_email }],
      photos: profile.picture ? [{ value: profile.picture }] : [],
      provider: 'google',
    };
  }

  generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('base64url');
  }
}
