const fs = require("fs");

// Specify the path to the JSON file
const packageFilePath = "./package.json";
const manifestFilePath = "./plugin/manifest.json";

// Read the JSON file
const packageContent = fs.readFileSync(packageFilePath, "utf8");
const packageJson = JSON.parse(packageContent);

const updatedVersion = packageJson.version;

const manifestContent = fs.readFileSync(manifestFilePath, "utf8");
const manifestJson = JSON.parse(manifestContent);
manifestJson.version = updatedVersion;

console.log('manifestJson.version:',manifestJson.version);
fs.writeFileSync(
  manifestFilePath,
  JSON.stringify(manifestJson, null, 2),
  "utf8"
);
