// index.ts
import { Project, VariableDeclarationKind } from "ts-morph";
import path from "path";
async function generateConfig(options) {
  const { inputGlob, outputFile, baseDir, varName, specificKeyword, write, importType = "default" } = options;
  const project = new Project({
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
      const fileName = path.basename(sourceFile.getFilePath(), `.${specificKeyword.toLocaleLowerCase()}.ts`);
      className = fileName.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("") + (specificKeyword.charAt(0).toUpperCase() + specificKeyword.slice(1));
    }
    const relativePath = path.relative(baseDir, sourceFile.getFilePath());
    const fullPath = relativePath.replace(/\\/g, "/").replace(".ts", "");
    const moduleSpecifier = path.relative(path.dirname(options.outputFile), sourceFile.getFilePath()).replace(/\\/g, "/").replace(".ts", "");
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
    declarationKind: VariableDeclarationKind.Const,
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
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: varName,
        initializer: (writer) => write(writer, classes)
      }]
    });
  }
  await project.save();
  console.log(`\u2705 ${varName} generated at ${outputFile}`);
}
export {
  generateConfig
};
