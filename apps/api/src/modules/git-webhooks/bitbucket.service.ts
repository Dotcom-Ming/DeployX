export class BitbucketService {

  parsePushEvent(body: any): {
    branch: string;
    commitSha: string;
    commitMessage: string;
    repo: string;
  } | null {
    try {
      const changes = body.push?.changes;
      if (!changes || changes.length === 0) {
        return null;
      }

      const change = changes[0];
      const newCommit = change.new;
      if (!newCommit) {
        return null;
      }

      const branch = newCommit.name || newCommit.target?.refName || '';
      const commit = newCommit.target?.hash || '';

      return {
        branch,
        commitSha: commit,
        commitMessage: change.new?.target?.message || '',
        repo: body.repository?.full_name || '',
      };
    } catch (error) {
      console.error('Failed to parse Bitbucket push event', error);
      return null;
    }
  }

  parsePullRequestEvent(body: any): {
    prNumber: number;
    branch: string;
    commitSha: string;
    repo: string;
    action: string;
  } | null {
    try {
      const pr = body.pullrequest;
      if (!pr) {
        return null;
      }

      return {
        prNumber: pr.id,
        branch: pr.source?.branch?.name || '',
        commitSha: pr.source?.commit?.hash || '',
        repo: body.repository?.full_name || '',
        action: body.eventKey?.replace('pullrequest:', '') || '',
      };
    } catch (error) {
      console.error('Failed to parse Bitbucket pull request event', error);
      return null;
    }
  }
}
