// You can use the ESModules syntax and @kintone/rest-api-client without additional settings.
// import { KintoneRestAPIClient } from "@kintone/rest-api-client";

jQuery.noConflict();

(($, PLUGIN_ID) => {
  "use strict";

  const KEY = PLUGIN_ID;
  const CONF = kintone.plugin.app.getConfig(KEY);

  const saveSettings = (config: object) => {
    kintone.plugin.app.setConfig(config, () => {
      alert("The plug-in settings have been saved. Please update the app.");
    });
  };

  const ajaxErrorHandler = (error: any) => {
    alert(error);
  };

  const makeGraphQLRequest = (
    url: string,
    headers: object,
    data: string,
    successCallback: any
  ) => {
    $.ajax({
      url: url,
      method: "post",
      headers: headers,
      data: data,
      success: (response: any) => {
        if (response.errors) {
          handleError(response.errors);
        }

        if (response.data) {
          successCallback(response.data);
        }
      },
      error: ajaxErrorHandler,
    });
  };

  const handleError = (errors: any[]) => {
    let errorMessage: string = "";
    errors.forEach(
      (error: {
        message: string;
        locations: Array<{ line: number; column: number }>;
      }) => {
        errorMessage += `${error.message}\n`;
      }
    );
    alert(errorMessage);
  };

  $(document).ready(() => {
    const apiUrlInput = $(".js-zenhub-api-url");
    const apiTokenInput = $(".js-zenhub-api-token");
    const workspaceNameInput = $(".js-zenhub-workspace-name");
    const workspaceIdInput = $(".js-zenhub-workspace-id");
    const repositoriesConnectionHidden = $(
      ".js-zendhub-repositories-connection"
    );
    const repositoriesConnectionArea = $(
      ".js-zendhub-repositories-connection-area"
    );

    const addRepositoryConnection = (name: string, ghId: number) => {
      const rowElement = document.createElement("p");
      rowElement.className = "kintoneplugin-row";
      const nameElement = document.createElement("input");
      nameElement.type = "text";
      nameElement.className = "js-zenhub-workspace kintoneplugin-input-text";
      nameElement.readOnly = true;
      nameElement.value = name;
      const idElement = document.createElement("input");
      idElement.type = "text";
      idElement.className = "js-zenhub-workspace kintoneplugin-input-text";
      idElement.readOnly = true;
      idElement.value = ghId.toString();
      rowElement.append(nameElement);
      rowElement.append(idElement);

      repositoriesConnectionArea.append(rowElement);
    };

    const resetWorkspace = () => {
      workspaceIdInput.val("");
      repositoriesConnectionHidden.val("");
      repositoriesConnectionArea.empty();
    };

    if (
      !(apiUrlInput && apiTokenInput && workspaceNameInput && workspaceIdInput)
    ) {
      throw new Error("Required elements do not exist.");
    }

    if (CONF.apiUrl) {
      apiUrlInput.val(CONF.apiUrl);
    }

    if (CONF.apiToken) {
      apiTokenInput.val(CONF.apiToken);
    }

    if (CONF.workspaceName) {
      workspaceNameInput.val(CONF.workspaceName);
    }

    if (CONF.workspaceId) {
      workspaceIdInput.val(CONF.workspaceId);
    }

    if (CONF.repositoriesConnection) {
      repositoriesConnectionHidden.val(CONF.repositoriesConnection);
      const repoConnections = JSON.parse(CONF.repositoriesConnection);
      repoConnections.forEach((repo: { name: string; ghId: number }) => {
        if (repo.name && repo.ghId) {
          addRepositoryConnection(repo.name, repo.ghId);
        }
      });
    }

    $(".js-save-settings").click(() => {
      saveSettings({
        apiUrl: apiUrlInput.val(),
        apiToken: apiTokenInput.val(),
        workspaceName: workspaceNameInput.val(),
        workspaceId: workspaceIdInput.val(),
        repositoriesConnection: repositoriesConnectionHidden.val(),
      });
    });

    $(".js-get-workspace").click(() => {
      resetWorkspace();
      const headers = {
        Authorization: `Bearer ${apiTokenInput.val()}`,
        "Content-Type": "application/json",
      };
      const data = JSON.stringify({
        query: `query ($workspace: String!) {
            viewer {
              id
              searchWorkspaces(query: $workspace) {
                  nodes {
                      id
                      name
                      repositoriesConnection {
                          nodes {
                              name
                              ghId
                          }
                      }
                  }
              }
            }
            }`,
        variables: {
          workspace: workspaceNameInput.val(),
        },
      });

      makeGraphQLRequest(apiUrlInput.val(), headers, data, (response: any) => {
        const isWorkspaceNotFound = (responseData: any): boolean => {
          return (
            !responseData.viewer ||
            !responseData.viewer.searchWorkspaces ||
            !responseData.viewer.searchWorkspaces.nodes ||
            responseData.viewer.searchWorkspaces.nodes.length === 0
          );
        };

        if (isWorkspaceNotFound(response)) {
          alert("Workspace not found");
          return;
        }

        const repoConnectionValue: Array<{ name: string; ghId: number }> = [];
        const repoConnectionRes =
          response.viewer.searchWorkspaces.nodes[0].repositoriesConnection;
        const nodes: Array<{ name: string; ghId: number }> =
          repoConnectionRes.nodes;
        nodes.forEach((node) => {
          addRepositoryConnection(node.name, node.ghId);
          repoConnectionValue.push({ name: node.name, ghId: node.ghId });
        });
        workspaceIdInput.val(response.viewer.searchWorkspaces.nodes[0].id);
        repositoriesConnectionHidden.val(JSON.stringify(repoConnectionValue));
      });
    });
  });
})(jQuery, kintone.$PLUGIN_ID);
