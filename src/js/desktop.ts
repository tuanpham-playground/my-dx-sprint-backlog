import type { Issue } from "./types";
import { lookupIssue as lookupIssueGithub } from "./github";
import { lookupIssue as lookupIssueZenhub } from "./zenhub";
import { RESOURCE_TYPE } from "./constants";

// @ts-expect-error
jQuery.noConflict();

(($, PLUGIN_ID) => {
  "use strict";

  const CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!CONFIG) {
    return false;
  }

  const isAutoUpdateStatus = CONFIG.autoUpdateStatus === "1";

  interface Event {
    appId: number;
    recordId: number;
    record: kintone.types.SavedSprintBacklog;
    changes: any;
  }

  interface Record {
    record: kintone.types.SavedSprintBacklog;
  }

  type Unpacked<T> = T extends Array<infer U> ? U : T;
  type Backlog = Unpacked<kintone.types.Backlog>;

  const lookupIssue = (backlog: Backlog): Promise<Issue | undefined> => {
    const repoName = backlog.value.repo.value;
    const issueKey = parseInt(backlog.value.issue.value, 10);
    if (!repoName || !issueKey) {
      return Promise.resolve(undefined);
    }

    if (CONFIG.type === RESOURCE_TYPE.GITHUB) {
      return lookupIssueGithub(CONFIG, repoName, issueKey);
    } else if (CONFIG.type === RESOURCE_TYPE.ZENHUB) {
      return lookupIssueZenhub(CONFIG, repoName, issueKey);
    }

    return Promise.reject();
  };

  const clearValue = (targetBacklog: Backlog) => {
    const backlog = targetBacklog;
    backlog.value.pbi_title.value = "";
    backlog.value.pbi_link.value = "";
    backlog.value.pbi_storypoint.value = "";
    if (isAutoUpdateStatus) {
      backlog.value.pbi_status.value = "";
    }

    return backlog;
  };

  const setValue = (targetBacklog: Backlog, targetIssue: Issue): Backlog => {
    if (!targetIssue) {
      return targetBacklog;
    }

    if (!targetBacklog.value.repo.value || !targetBacklog.value.issue.value) {
      return targetBacklog;
    }

    const backlog = clearValue(targetBacklog);
    backlog.value.pbi_title.value = targetIssue.title;
    backlog.value.pbi_link.value = targetIssue.url;
    backlog.value.pbi_storypoint.value =
      targetIssue.storyPoint ?? backlog.value.pbi_storypoint.value;
    if (isAutoUpdateStatus) {
      backlog.value.pbi_status.value =
        targetIssue.status ?? backlog.value.pbi_status.value;
    }

    return backlog;
  };

  const getChangedRowIndexById = (
    changedRowId: number,
    event: Event
  ): number => {
    return event.record.Table.value.findIndex((element) => {
      return element.id === changedRowId;
    });
  };

  const getChangedRowIndexByValue = (
    changedValue: Backlog,
    event: Event
  ): number => {
    return event.record.Table.value.findIndex((element) => {
      const value = element.value;
      return (
        changedValue.value.issue.value === value.issue.value &&
        changedValue.value.repo.value === value.repo.value
      );
    });
  };

  const getChangedRow = (
    event: Event
  ): { index: number; backlog?: Backlog } => {
    const changedValue: Backlog = event.changes.row;
    if (!changedValue.value.issue.value || !changedValue.value.repo.value) {
      return { index: -1 };
    }

    let changedRowIndex;
    if (changedValue.id) {
      changedRowIndex = getChangedRowIndexById(changedValue.id, event);
    } else {
      changedRowIndex = getChangedRowIndexByValue(changedValue, event);
    }

    return {
      index: changedRowIndex,
      backlog: event.record.Table.value[changedRowIndex],
    };
  };

  const updateEvent = (event: Event) => {
    const changedRow = getChangedRow(event);
    if (changedRow.index === -1 || !changedRow.backlog) {
      return;
    }

    lookupIssue(changedRow.backlog).then((resp) => {
      if (!resp) {
        return;
      }
      const record: Record = kintone.app.record.get();
      const currentBacklog = record.record.Table.value[changedRow.index];
      record.record.Table.value[changedRow.index] = setValue(
        currentBacklog,
        resp
      );

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
