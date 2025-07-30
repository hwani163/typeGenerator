import { CodeBlockWriter, Project, VariableDeclarationKind } from 'ts-morph';
import path from 'path';

export interface GenerateOptions {
  inputGlob: string;
  outputFile: string;
  baseDir: string;
  varName: string;
  specificKeyword: string;
  importType?: 'default' | 'type';
  write: (writer: CodeBlockWriter, classes: { className: string, path: string }[]) => void;
}
// hehe
export async function generate(options: GenerateOptions) {
  const { inputGlob, outputFile, baseDir, varName, specificKeyword, write, importType = 'default' } = options;

  const project = new Project({
    manipulationSettings: {
      indentationText: '  ' as any, // 2 spaces
    },
  });
  const sourceFiles = project.addSourceFilesAtPaths(inputGlob);
  const configFile = project.createSourceFile(outputFile, '', { overwrite: true });
  const classes = [] as { className: string, path: string }[];

  // 각 소스 파일을 순회하면서 클래스 정보 추출
  for (const sourceFile of sourceFiles) {
    /**
     * STEP 1: export된 클래스 찾기
     * 파일에서 export된 클래스를 찾습니다.
     * 지원하는 형태:
     * - export default class UserRoute { ... }
     * - export class UserRoute { ... }
     * - class UserRoute { ... } export { UserRoute }
     * - class UserRoute { ... } export { UserRoute as default }
     */
    let routeClass = sourceFile.getClasses().find(c => c.isDefaultExport());
    
    if (!routeClass) {
      // export default가 없으면 다른 export 방식 찾기
      routeClass = sourceFile.getClasses().find(c => c.isExported());
      
      if (!routeClass) {
        // named export도 없으면 export 구문에서 찾기
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
      console.warn(`⚠️  No exported class found in ${sourceFile.getFilePath()}, skipping...`);
      continue;
    }

    /**
     * STEP 2: 클래스 이름 결정
     * 클래스에 이름이 있으면 사용하고, 없으면 파일명으로부터 생성합니다.
     */
    let className = routeClass.getName(); // 예: export default class MyRoute -> "MyRoute"

    if (!className) {
      /**
       * 익명 클래스의 경우 파일명으로부터 클래스명 생성
       * 예: 'user.route.ts' -> 'user' -> 'UserRoute'
       * 예: 'short-code.route.ts' -> 'short-code' -> 'ShortCodeRoute'
       */
      const fileName = path.basename(sourceFile.getFilePath(), `.${specificKeyword.toLocaleLowerCase()}.ts`);
      className = fileName
        .split('-') // 하이픈으로 분리
        .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // 각 부분을 PascalCase로
        .join('') + (specificKeyword.charAt(0).toUpperCase() + specificKeyword.slice(1)); // 키워드 추가
    }

    /**
     * STEP 3: 파일 경로 처리
     * 상대 경로를 계산하고 URL 경로 형태로 변환합니다.
     */
    const relativePath = path.relative(baseDir, sourceFile.getFilePath());
    const fullPath = relativePath.replace(/\\/g, '/').replace('.ts', '');
    // 주석 처리된 부분들은 추후 라우팅 경로 변환 로직으로 활용 가능:
    // - Windows 경로를 Unix 경로로 변환: .replace(/\\/g, '/')
    // - 동적 라우팅 패턴 변환: .replace(/\[([^\]]+)\]/g, ':$1') 
    // - 현재 디렉토리 제거: .replace(/^\./, '')
    // - index 파일 경로 정리: .replace(/\/index$/, '') || '/';

    // Import 구문 생성
    let moduleSpecifier = path.relative(path.dirname(options.outputFile), sourceFile.getFilePath())
      .replace(/\\/g, '/')
      .replace('.ts', '');
    
    // 상대 경로에 ./ 또는 ../ 접두사 추가
    if (!moduleSpecifier.startsWith('.')) {
      moduleSpecifier = `./${moduleSpecifier}`;
    }

    const isDefaultExport = routeClass.isDefaultExport();

    switch (importType) {
      case 'type':
        if (isDefaultExport) {
          configFile.addImportDeclaration({
            defaultImport: className,
            moduleSpecifier,
            isTypeOnly: true,
          });
        } else {
          configFile.addImportDeclaration({
            namedImports: [className],
            moduleSpecifier,
            isTypeOnly: true,
          });
        }
        break;
      case 'default':
      default:
        if (isDefaultExport) {
          configFile.addImportDeclaration({
            defaultImport: className,
            moduleSpecifier,
          });
        } else {
          configFile.addImportDeclaration({
            namedImports: [className],
            moduleSpecifier,
          });
        }
        break;
    }

    /**
     * STEP 5: 클래스 정보 저장
     * 나중에 사용할 수 있도록 클래스 정보를 배열에 저장합니다.
     */
    classes.push({
      className: className,
      path: fullPath,
    });
  }

  /**
   * STEP 6: Export 변수 생성
   * 모든 클래스 정보를 담은 변수를 생성하고 export합니다.
   * 사용자가 제공한 write 함수를 통해 커스텀 출력 형태를 생성할 수 있습니다.
   */
  
  // keys 배열 생성 (공통)
  configFile.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: 'keys',
      initializer: `[${classes.map(({ className }) => `'${className}'`).join(', ')}] as const`,
    }],
  });

  if (importType === 'type') {
    // type import의 경우 인터페이스 생성
    configFile.addInterface({
      isExported: true,
      name: varName.charAt(0).toUpperCase() + varName.slice(1), // PascalCase로 변환
      properties: classes.map(({ className }) => ({
        name: className,
        type: className,
      })),
    });
  } else {
    // 일반 import의 경우 사용자가 제공한 write 함수 사용
    configFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: varName,
        initializer: (writer) => write(writer, classes),
      }],
    });
  }

  /**
   * STEP 7: 파일 저장 및 완료 메시지
   * 생성된 TypeScript 파일을 디스크에 저장하고 완료 메시지를 출력합니다.
   */
  await project.save();
  console.log(`✅ ${varName} generated at ${outputFile}`);
}