import { ConfigZenhub, Issue } from "./types";
import { generateGraphQLRequest } from "./graphql-utils";

type RepoConnection = { name: string; ghId: number };

export const lookupIssue = (
  config: ConfigZenhub,
  repoName: string,
  issueNumber: number
): Promise<Issue | undefined> => {
  const headers = makeRequestHeaders(config.zenhubApiToken);
  const repoId = getRepoConnectionId(
    JSON.parse(config.repositoriesConnection),
    repoName
  );
  const body = makeRequestBody(repoId, issueNumber);
  return generateGraphQLRequest(config.zenhubApiUrl, headers, body).then(
    (resp) => {
      if (!resp.data) {
        return undefined;
      }

      const issueInfo = resp.data.issueByInfo;
      if (!issueInfo) {
        return undefined;
      }

      return convertToIssue(issueInfo);
    }
  );
};

const makeRequestHeaders = (apiToken: string) => {
  return {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };
};

const getRepoConnectionId = (
  repositoriesConnection: RepoConnection[],
  repoName: string
): number => {
  const repoConnection = repositoriesConnection.find(
    (repo) => repoName === repo.name
  );

  return repoConnection ? repoConnection.ghId : 0;
};

const makeRequestBody = (repoId: number, issue: number): string => {
  return JSON.stringify({
    query: `query getIssueInfo($repositoryGhId: Int!, $issueNumber: Int!) {
        issueByInfo(repositoryGhId: $repositoryGhId, issueNumber: $issueNumber) {
          id
          repository {
            id
            ghId
          }
          number
          title
          htmlUrl
          state
          estimate {
            value
          }
          pipelineIssues {
            nodes {
              pipeline {
                name
              } 
            }
          }
        }
      }`,
    variables: {
      repositoryGhId: repoId,
      issueNumber: issue,
    },
  });
};

const convertPipelineToStatus = (pipeline: string): string => {
  const statusMapping: { [pipeline: string]: string } = {
    ready: "🔜 Ready",
    icebox: "🔜 Ready",
    "new issues": "🔜 Ready",
    "in progress": "🏃 In Progress",
    "in review": "🏃 In Progress",
    feedback: "🏃 In Progress",
    closed: "🎉 Done",
  };

  return statusMapping[pipeline.toLowerCase()];
};

const convertToIssue = (targetIssue: any): Issue => {
  const issueInfo: Issue = {
    title: targetIssue.title,
    url: targetIssue.htmlUrl,
  };

  if (targetIssue.estimate) {
    issueInfo.storyPoint = targetIssue.estimate.value;
  }

  if (targetIssue.state === "CLOSED") {
    issueInfo.status = convertPipelineToStatus(targetIssue.state);
  } else {
    issueInfo.status = convertPipelineToStatus(
      targetIssue.pipelineIssues.nodes[0].pipeline.name
    );
  }

  return issueInfo;
};
