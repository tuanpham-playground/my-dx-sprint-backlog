# DX Sprint Backlog

A plugin for getting Zendhub or Github Project data.

It's only for the "DX Sprint Backlog" app. Not available in other apps.

## Manual settings for DX Sprint Backlog kintone app

Manual setting for below fields:

### Table

`fieldCode`: `Table`

### Repo

`type`: `Drop-Down`

`fieldCode`: `repo`

`Values`: `js-sdk`, `dx-internal`, `cli-kintone`, `js-sdk-ja`, `js-sdk-private`

`Default value`: `dx-internal`

### Issue Key

`type`: `Number`

`fieldCode`: `issue`

### Story point

`type`: `Number`

`fieldCode`: `pbi_storypoint`

### Status (with picture): 

`type`: `Drop-Down`

`fieldCode`: `pbi_status`

`Values`: `🔜 Ready`, `🏃 In Progress`, `🎉 Done`, `⛔️ Canceled`

### Title

`type`: `Text`

`fieldCode`: `pbi_title`

### Link

`type`: `link`

`fieldCode`: `pbi_link`

### Achieved Storypoint

`type`: `Calculated`

`fieldCode`: `pbi_acheived_storypoint`

`Formula`: `IF(pbi_status="🎉 Done",pbi_storypoint,0)`


## Commands for building, packaging, and deploying
```shell
# build production
$ npm run build:prod

# packaging
$  kintone-plugin-packer ./plugin --out my_plugin.zip --ppk private.ppk

# deploying
$ kintone-plugin-uploader --base-url https://sub_domain.domain.com --username <username> --password <password> /<path_to_plugin_repo>/my_plugin.zip
```


## LICENSE

- [MIT](https://github.com/kintone/cli-kintone/blob/main/LICENSE)
