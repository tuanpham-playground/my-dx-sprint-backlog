import { ConfigGithub, Issue } from "./types";
import { generateGraphQLRequest } from "./graphql-utils";

export const lookupIssue = (
  config: ConfigGithub,
  repoName: string,
  issueNumber: number
): Promise<Issue | undefined> => {
  const headers = makeRequestHeaders(config.githubApiToken);
  const body = makeRequestBody(repoName, issueNumber);
  return generateGraphQLRequest(config.githubApiUrl, headers, body).then(
    (resp) => {
      if (!resp.data) {
        return undefined;
      }
      const issueInfo = resp.data.repository.issue;
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

const makeRequestBody = (repoName: string, issue: number): string => {
  return JSON.stringify({
    query: `query ($repoName: String!, $issueNumber: Int!){
          repository(owner: "kintone", name: $repoName) {
            issue(number: $issueNumber) {
              id
              title
              state
              url
              projectItems(first: 10) {
                nodes {
                  fieldValues(first: 10) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        id
                        name
                        field {
                          ... on ProjectV2SingleSelectField {
                            id
                            name
                            dataType
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldNumberValue {
                        id
                        number
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                            dataType
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
    variables: {
      repoName: repoName,
      issueNumber: issue,
    },
  });
};

const convertToStatusValue = (value: string): string => {
  const statusMapping: { [value: string]: string } = {
    ready: "🔜 Ready",
    icebox: "🔜 Ready",
    new: "🔜 Ready",
    "in progress": "🏃 In Progress",
    "in review": "🏃 In Progress",
    done: "🎉 Done",
    closed: "🎉 Done",
  };

  return Object.keys(statusMapping)
    .filter((key) => value.toLowerCase().includes(key))
    .reduce((cur, key) => {
      return statusMapping[key];
    }, "");
};

const convertToIssue = (targetIssue: any): Issue => {
  const issueInfo: Issue = {
    title: targetIssue.title,
    url: targetIssue.url,
  };

  const fieldValues = getFieldValues(
    targetIssue.projectItems.nodes[0].fieldValues.nodes
  );

  const storyPoint = fieldValues.find(
    (field) => field.name.toLowerCase() === "storypoint"
  );
  if (storyPoint) {
    issueInfo.storyPoint = storyPoint.value;
  }

  const isCanceledStatus = isCanceled(
    targetIssue.projectItems.nodes[0].fieldValues.nodes,
    "Canceled"
  );
  if (targetIssue.state === "CLOSED") {
    issueInfo.status = isCanceledStatus
      ? "⛔️ Canceled"
      : convertToStatusValue(targetIssue.state);
  } else {
    const status = fieldValues.find(
      (field) => field.name.toLowerCase() === "status"
    );
    if (status) {
      issueInfo.status = convertToStatusValue(status.value);
    }
  }

  return issueInfo;
};

const getFieldValues = (
  fieldValues: any[]
): Array<{ name: string; value: string }> => {
  if (!fieldValues || fieldValues.length === 0) {
    return [];
  }

  return fieldValues
    .filter((value) => !!value.id)
    .map((element) => {
      const name = element.field.name;
      let value;
      switch (element.field.dataType) {
        case "NUMBER":
          value = element.number;
          break;
        case "SINGLE_SELECT":
        default:
          value = element.name;
      }
      return { name, value };
    });
};

const isCanceled = (arr: any, target: string): boolean => {
  debugger;
  for (let i = 0; i < arr.length; i++) {
    const isExist =
      arr[i].field &&
      arr[i].field.name === "Status" &&
      arr[i].name &&
      arr[i].name.includes(target);
    if (isExist) {
      return true;
    }
  }
  return false;
};
