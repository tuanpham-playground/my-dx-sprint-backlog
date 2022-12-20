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

  interface Event {
    appId: number;
    recordId: number;
    record: kintone.types.SavedSprintBacklog;
  }

  interface Record {
    record: kintone.types.SavedSprintBacklog;
  }

  type Unpacked<T> = T extends (infer U)[] ? U : T;
  type Backlog = Unpacked<kintone.types.SprintBacklog["Table"]["value"]>;

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

  const lookupIssue = (event: Event) => {
    const record = event.record;
    const backlogs = record["Table"].value;
    const requests: Promise<any>[] = [];
    backlogs.forEach((backlog) => {
      const repoName: kintone.fieldTypes.SingleLineText["value"] = backlog.value.repo.value;
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

  const clearValue = (targetBacklog: Backlog) => {
    const backlog = targetBacklog;
    backlog.value.pbi_title.value = '';
    backlog.value.pbi_link.value = '';
    backlog.value.pbi_storypoint.value = '';
    backlog.value.pbi_status.value = convertPipelineToStatus("ready");

    return backlog;
  };

  const setValue = (targetBacklog: Backlog, issueInfo: any) => {
    const backlog = targetBacklog;
    if (!issueInfo) {
      return backlog;
    }

    if (!backlog.value.repo.value || !backlog.value.issue.value) {
      return backlog;
    }

    backlog.value.pbi_title.value = issueInfo.title;
    backlog.value.pbi_link.value = issueInfo.htmlUrl;
    if (issueInfo.estimate) {
      backlog.value.pbi_storypoint.value = issueInfo.estimate.value;
    }

    if (issueInfo.state === "CLOSED") {
      backlog.value.pbi_status.value = convertPipelineToStatus(issueInfo.state);
    } else {
      backlog.value.pbi_status.value = convertPipelineToStatus(
        issueInfo.pipelineIssues.nodes[0].pipeline.name
      );
    }

    return backlog;
  };

  const updateEvent = (event: Event) => {
    kintone.Promise.all(lookupIssue(event)).then( (resp) => {
      const record: Record = kintone.app.record.get();
      const backlogs = record.record.Table.value;
      const updatedBacklogs = [];
      for (let index = 0; index < backlogs.length; index++) {
        const issueInfo = resp[index]?.data?.issueByInfo;
        let backlog: Backlog = backlogs[index];
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
    (event: Event) => updateEvent(event)
  );
})(jQuery, kintone.$PLUGIN_ID);
