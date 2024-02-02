// You can use the ESModules syntax and @kintone/rest-api-client without additional settings.
// import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { ConfigBase } from "./types";
import { ConfigManagerGithub } from "./config-manager-github";
import { ConfigManagerZenhub } from "./config-manager-zenhub";
import { RESOURCE_TYPE } from "./constants";

// @ts-expect-error
jQuery.noConflict();

(($, PLUGIN_ID) => {
  "use strict";
  // fix bug 17

  const CONF = kintone.plugin.app.getConfig(PLUGIN_ID);

  const saveSettings = (config: object) => {
    kintone.plugin.app.setConfig(config, () => {
      alert("The plug-in settings have been saved. Please update the app.");
    });
  };

  let configManager: ConfigBase;
  const initConfigManager = (type: string) => {
    updateConfigManager(type);
  };

  const updateConfigManager = (type: string) => {
    if (type.toLowerCase() === RESOURCE_TYPE.GITHUB) {
      configManager = new ConfigManagerGithub(CONF);
    } else if (type.toLowerCase() === RESOURCE_TYPE.ZENHUB) {
      configManager = new ConfigManagerZenhub(CONF);
    } else {
      throw Error(`Unsupported resource type: ${type}`);
    }
  };

  $(document).ready(() => {
    $(".js-settings-resource").hide();
    const type = CONF.type || RESOURCE_TYPE.GITHUB;
    initConfigManager(type);
    $("select[name='type']").val(type);

    const autoUpdateStatusChk = $("input#js-auto-update-status");
    autoUpdateStatusChk.prop("checked", CONF.autoUpdateStatus === "1");

    configManager.show();
    configManager.populate();

    $("#resource-type").change(() => {
      $(".js-settings-resource").hide();
      updateConfigManager($("#resource-type").val());
      configManager.show();
      configManager.populate();
    });

    $(".js-save-settings").click(() => {
      const settings = configManager.getSettingsForSave();
      settings.autoUpdateStatus = autoUpdateStatusChk.prop("checked")
        ? "1"
        : "0";
      saveSettings(Object.assign(CONF, settings));
    });
  });
})(jQuery, kintone.$PLUGIN_ID);
