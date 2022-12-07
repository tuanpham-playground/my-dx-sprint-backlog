// You can use the ESModules syntax and @kintone/rest-api-client without additional settings.
// import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// @ts-expect-error
jQuery.noConflict();

(($, PLUGIN_ID) => {
  "use strict";

  const CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!CONFIG) {
    return false;
  }

  const CONFIG_API_URL = CONFIG.apiUrl;
  const CONFIG_API_TOKEN = CONFIG.apiToken;
  const CONFIG_WORKSPACE_ID = CONFIG.workspaceId;
  const CONFIG_REPO_CONNECTION = JSON.parse(CONFIG.repositoriesConnection);

  const makeGraphQLRequest = (url: string, headers: object, data: string) => {
    return $.ajax({
      url: url,
      method: "post",
      headers: headers,
      data: data,
    });
  };

  const getRepoConnectionId = (repoName: string): number => {
    const repoConnection = CONFIG_REPO_CONNECTION.find(
      (repo: { name: string; ghId: number }) => repoName === repo.name
    );
    return repoConnection ? repoConnection.ghId : 0;
  };

  const makeRequestInfo = (
    repoId: number,
    issue: number
  ): { headers: object; data: string } => {
    const headers = {
      Authorization: `Bearer ${CONFIG_API_TOKEN}`,
      "Content-Type": "application/json",
    };
    const data = JSON.stringify({
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

    return {
      headers,
      data,
    };
  };

  const lookupIssue = (event: any) => {
    const record = event.record;
    const backlogs = record.Table.value;
    const requests: any[] = [];
    backlogs.forEach((backlog: any) => {
      const repoName = backlog.value.repo.value;
      const issueKey = parseInt(backlog.value.issue.value, 10);
      if (!repoName || !issueKey) {
        requests.push(Promise.resolve());
        return;
      }

      const repoId = getRepoConnectionId(repoName);
      const { headers, data } = makeRequestInfo(repoId, issueKey);
      const request = makeGraphQLRequest(CONFIG_API_URL, headers, data);
      requests.push(request);
    });

    return requests;
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

  const clearValue = (targetBacklog: any) => {
    const backlog = targetBacklog;
    backlog.value.title.value = undefined;
    backlog.value.link.value = undefined;
    backlog.value.storypoint.value = undefined;
    backlog.value.status.value = convertPipelineToStatus("ready");

    return backlog;
  };

  const setValue = (targetBacklog: any, issueInfo: any) => {
    const backlog = targetBacklog;
    if (!issueInfo) {
      return backlog;
    }

    if (!backlog.value.repo.value || !backlog.value.issue.value) {
      return backlog;
    }

    backlog.value.title.value = issueInfo.title;
    backlog.value.link.value = issueInfo.htmlUrl;
    if (issueInfo.estimate) {
      backlog.value.storypoint.value = parseInt(issueInfo.estimate.value, 10);
    }

    if (issueInfo.state === "CLOSED") {
      backlog.value.status.value = convertPipelineToStatus(issueInfo.state);
    } else {
      backlog.value.status.value = convertPipelineToStatus(
        issueInfo.pipelineIssues.nodes[0].pipeline.name
      );
    }

    return backlog;
  };

  const updateEvent = (event: { record: any }) => {
    kintone.Promise.all(lookupIssue(event)).then(function (resp) {
      const record = kintone.app.record.get();
      const backlogs = record.record.Table.value;
      const updatedBacklogs = [];
      for (let index = 0; index < backlogs.length; index++) {
        const issueInfo = resp[index]?.data?.issueByInfo;
        let backlog = backlogs[index];
        backlog = clearValue(backlog);
        backlog = setValue(backlog, issueInfo);
        updatedBacklogs.push(backlog);
      }
      record.record.Table.value = updatedBacklogs;

      kintone.app.record.set(record);
    });
  };

  return kintone.events.on(
    [
      "app.record.create.change.issue",
      "app.record.edit.change.issue",
      "app.record.create.change.repo",
      "app.record.edit.change.repo",
    ],
    (event) => updateEvent(event)
  );
})(jQuery, kintone.$PLUGIN_ID);
