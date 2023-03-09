import type { ConfigBase, ConfigZenhub } from "./types";
import { makeGraphQLRequest } from "./graphql-utils";
import { RESOURCE_TYPE } from "./constants";

const $ = jQuery;

type RepoConnection = { name: string; ghId: number };

export class ConfigManagerZenhub implements ConfigBase {
  private elements: any;
  private readonly settings: ConfigZenhub;
  constructor(settings: ConfigZenhub) {
    this.settings = settings;
    this.elements = {
      settingsArea: $("#zenhub-settings"),
      apiUrlInput: $(".js-zenhub-api-url"),
      apiTokenInput: $(".js-zenhub-api-token"),
      workspaceNameInput: $(".js-zenhub-workspace-name"),
      getWorkSpaceBtn: $(".js-get-workspace"),
      workspaceIdInput: $(".js-zenhub-workspace-id"),
      repositoriesConnectionHidden: $(".js-zendhub-repositories-connection"),
      repositoriesConnectionArea: $(".js-zendhub-repositories-connection-area"),
    };

    this._bindEvents();
  }

  _bindEvents() {
    this.elements.getWorkSpaceBtn.click(() => {
      this.resetWorkspace();
      const headers = {
        Authorization: `Bearer ${this.elements.apiTokenInput.val()}`,
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
          workspace: this.elements.workspaceNameInput.val(),
        },
      });

      makeGraphQLRequest(
        this.elements.apiUrlInput.val(),
        headers,
        data,
        (response: any) => this._generateRepositoriesConnection(response)
      );
    });
  }

  _generateRepositoriesConnection(response: any) {
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

    const repoConnectionValue: RepoConnection[] = [];
    const repoConnectionRes =
      response.viewer.searchWorkspaces.nodes[0].repositoriesConnection;
    const nodes: RepoConnection[] = repoConnectionRes.nodes;
    nodes.forEach((node) => {
      console.log(node);
      this.addRepositoryConnection(node.name, node.ghId);
      repoConnectionValue.push({ name: node.name, ghId: node.ghId });
    });
    this.elements.workspaceIdInput.val(
      response.viewer.searchWorkspaces.nodes[0].id
    );
    this.elements.repositoriesConnectionHidden.val(
      JSON.stringify(repoConnectionValue)
    );
  }

  show(): void {
    this.elements.settingsArea.show();
  }

  populate(): void {
    if (!this.settings) {
      return;
    }

    if (this.settings.zenhubApiUrl) {
      this.elements.apiUrlInput.val(this.settings.zenhubApiUrl);
    }

    if (this.settings.zenhubApiToken) {
      this.elements.apiTokenInput.val(this.settings.zenhubApiToken);
    }

    if (this.settings.workspaceName) {
      this.elements.workspaceNameInput.val(this.settings.workspaceName);
    }

    if (this.settings.workspaceId) {
      this.elements.workspaceIdInput.val(this.settings.workspaceId);
    }

    if (this.settings.repositoriesConnection) {
      this.elements.repositoriesConnectionHidden.val(
        this.settings.repositoriesConnection
      );
      const repoConnections = JSON.parse(this.settings.repositoriesConnection);
      repoConnections.forEach((repo: { name: string; ghId: number }) => {
        if (repo.name && repo.ghId) {
          this.addRepositoryConnection(repo.name, repo.ghId);
        }
      });
    }
  }

  reset(): void {
    this.resetWorkspace();
  }

  getSettingsForSave() {
    return {
      type: RESOURCE_TYPE.ZENHUB,
      zenhubApiUrl: this.elements.apiUrlInput.val(),
      zenhubApiToken: this.elements.apiTokenInput.val(),
      workspaceName: this.elements.workspaceNameInput.val(),
      workspaceId: this.elements.workspaceIdInput.val(),
      repositoriesConnection: this.elements.repositoriesConnectionHidden.val(),
    };
  }

  addRepositoryConnection(name: string, ghId: number) {
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

    this.elements.repositoriesConnectionArea.append(rowElement);
  }

  resetWorkspace() {
    this.elements.workspaceIdInput.val("");
    this.elements.repositoriesConnectionHidden.val("");
    this.elements.repositoriesConnectionArea.empty();
  }
}
