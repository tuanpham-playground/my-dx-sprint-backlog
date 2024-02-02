const fs = require("fs");

// Specify the path to the JSON file
const packageJson = "./package.json";
const manifestJson = "./plugin/manifest.json";

// Read the JSON file
fs.readFile(manifestJson, "utf8", async (err, manifestJsonData) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  let version = 0;
  await fs.readFile(packageJson, "utf8", (err, dataPackageJson) => {
    const jsonData = JSON.parse(dataPackageJson);
    version = jsonData.version;

    try {
      const json = JSON.parse(manifestJsonData);

      jsonData.version = version;

      const updatedJson = JSON.stringify(json, null, 2);
      console.log('before:',json);
      // Write the updated JSON back to the file
      fs.writeFile(manifestJson, updatedJson, "utf8", (err) => {
        if (err) {
          console.error("Error writing to the file:", err);
          return;
        }
        console.log("after, JSON file has been successfully updated.", manifestJson);
      });
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
    }
  });
});
