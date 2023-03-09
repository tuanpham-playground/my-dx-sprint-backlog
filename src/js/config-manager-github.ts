import type { ConfigBase, ConfigGithub } from "./types";
import { RESOURCE_TYPE } from "./constants";

const $ = jQuery;

export class ConfigManagerGithub implements ConfigBase {
  private elements: any;
  private readonly settings: ConfigGithub;
  constructor(settings: ConfigGithub) {
    this.settings = settings;
    this.elements = {
      settingsArea: $("#github-settings"),
      apiUrlInput: $(".js-github-api-url"),
      apiTokenInput: $(".js-github-api-token"),
    };
  }

  show(): void {
    this.elements.settingsArea.show();
  }

  populate(): void {
    if (!this.settings) {
      return;
    }

    if (this.settings.githubApiUrl) {
      this.elements.apiUrlInput.val(this.settings.githubApiUrl);
    }

    if (this.settings.githubApiToken) {
      this.elements.apiTokenInput.val(this.settings.githubApiToken);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  reset(): void {}

  getSettingsForSave() {
    return {
      type: RESOURCE_TYPE.GITHUB,
      githubApiUrl: this.elements.apiUrlInput.val(),
      githubApiToken: this.elements.apiTokenInput.val(),
    };
  }
}
