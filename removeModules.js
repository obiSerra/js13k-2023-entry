"strict";

const fs = require("fs");
const fsPromises = fs.promises;

const entry = "./src/index.ts";
const out = "./src/index_concat.ts";

const firstModules = [
  "./src/lib/contracts.ts",
  "./src/lib/entities.ts",
  "./src/lib/components.ts",
  "./src/lib/utils.ts",
];

const findFiles = async path => {
  const content = await fsPromises.readdir(path, { withFileTypes: true });
  let files = [];
  for (const entry of content) {
    if (entry.isDirectory()) {
      files = [...files, ...(await findFiles(`${path}/${entry.name}`))];
    } else {
      files.push(`${path}/${entry.name}`);
    }
  }
  return files;
};

const replaceImports = c => {
  return c.replace(new RegExp('import [a-z0-9\\s\\n{},]* from ".*";', "gi"), "");
};

(async () => {
  try {
    await fsPromises.unlink(out);
  } catch (e) {}

  const files = await findFiles("./src");
  let tsFiles = files.filter(file => file.endsWith(".ts") && file !== entry);

  const outContent = [];

  for (const m of firstModules) {
    let c = await fsPromises.readFile(m, "utf8");
    c = replaceImports(c)
      
    outContent.push(`\n\n // ---------------${m}----------------------- \n\n` + c);
    tsFiles = tsFiles.filter(file => file !== m);
  }

  for (const m of tsFiles) {
    let c = await fsPromises.readFile(m, "utf8");
    c = replaceImports(c)
    outContent.push(`\n\n // ---------------${m}----------------------- \n\n` + c);
    tsFiles = tsFiles.filter(file => file !== m);
  }

  for (const m of [entry]) {
    let c = await fsPromises.readFile(m, "utf8");
    c = c
      .split("\n")
      .filter(line => {
        return !line.startsWith("import") || line.startsWith(`import "./assets/main.scss";`);
      })
      .join("\n");
    outContent.push(`\n\n // ---------------${m}----------------------- \n\n` + c);
  }
  const exitContent = outContent.join("\n").replace(/export /g, "");
  fs.writeFileSync(out, exitContent);
})();
