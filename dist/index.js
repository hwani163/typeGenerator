"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  generateConfig: () => generateConfig
});
module.exports = __toCommonJS(index_exports);
var import_ts_morph = require("ts-morph");
var import_path = __toESM(require("path"));
async function generateConfig(options) {
  const { inputGlob, outputFile, baseDir, varName, specificKeyword, write, importType = "default" } = options;
  const project = new import_ts_morph.Project({
    manipulationSettings: {
      indentationText: "  "
      // 2 spaces
    }
  });
  const sourceFiles = project.addSourceFilesAtPaths(inputGlob);
  const configFile = project.createSourceFile(outputFile, "", { overwrite: true });
  const classes = [];
  for (const sourceFile of sourceFiles) {
    let routeClass = sourceFile.getClasses().find((c) => c.isDefaultExport());
    if (!routeClass) {
      routeClass = sourceFile.getClasses().find((c) => c.isExported());
      if (!routeClass) {
        const exportDeclarations = sourceFile.getExportDeclarations();
        for (const exportDecl of exportDeclarations) {
          const namedExports = exportDecl.getNamedExports();
          for (const namedExport of namedExports) {
            const exportName = namedExport.getName();
            const foundClass = sourceFile.getClass(exportName);
            if (foundClass) {
              routeClass = foundClass;
              break;
            }
          }
          if (routeClass) break;
        }
      }
    }
    if (!routeClass) {
      console.warn(`\u26A0\uFE0F  No exported class found in ${sourceFile.getFilePath()}, skipping...`);
      continue;
    }
    let className = routeClass.getName();
    if (!className) {
      const fileName = import_path.default.basename(sourceFile.getFilePath(), `.${specificKeyword.toLocaleLowerCase()}.ts`);
      className = fileName.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("") + (specificKeyword.charAt(0).toUpperCase() + specificKeyword.slice(1));
    }
    const relativePath = import_path.default.relative(baseDir, sourceFile.getFilePath());
    const fullPath = relativePath.replace(/\\/g, "/").replace(".ts", "");
    const moduleSpecifier = import_path.default.relative(import_path.default.dirname(options.outputFile), sourceFile.getFilePath()).replace(/\\/g, "/").replace(".ts", "");
    const isDefaultExport = routeClass.isDefaultExport();
    switch (importType) {
      case "type":
        if (isDefaultExport) {
          configFile.addImportDeclaration({
            defaultImport: className,
            moduleSpecifier,
            isTypeOnly: true
          });
        } else {
          configFile.addImportDeclaration({
            namedImports: [className],
            moduleSpecifier,
            isTypeOnly: true
          });
        }
        break;
      case "default":
      default:
        if (isDefaultExport) {
          configFile.addImportDeclaration({
            defaultImport: className,
            moduleSpecifier
          });
        } else {
          configFile.addImportDeclaration({
            namedImports: [className],
            moduleSpecifier
          });
        }
        break;
    }
    classes.push({
      className,
      path: fullPath
    });
  }
  configFile.addVariableStatement({
    isExported: true,
    declarationKind: import_ts_morph.VariableDeclarationKind.Const,
    declarations: [{
      name: "keys",
      initializer: `[${classes.map(({ className }) => `'${className}'`).join(", ")}] as const`
    }]
  });
  if (importType === "type") {
    configFile.addInterface({
      isExported: true,
      name: varName.charAt(0).toUpperCase() + varName.slice(1),
      // PascalCase로 변환
      properties: classes.map(({ className }) => ({
        name: className,
        type: className
      }))
    });
  } else {
    configFile.addVariableStatement({
      isExported: true,
      declarationKind: import_ts_morph.VariableDeclarationKind.Const,
      declarations: [{
        name: varName,
        initializer: (writer) => write(writer, classes)
      }]
    });
  }
  await project.save();
  console.log(`\u2705 ${varName} generated at ${outputFile}`);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateConfig
});
