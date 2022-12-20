# DX Sprint Backlog

A plugin for getting zendhub data.

It's only for the "DX Sprint Backlog" app. Not available in other apps.

## Manual settings for DX Sprint Backlog kintone app

Manual setting for below fields:

### Table

`fieldCode`: `sprint_pbis`

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

## LICENSE

- [MIT](https://github.com/kintone/cli-kintone/blob/main/LICENSE)
