import { describe, test, beforeEach, expect, vi } from 'vitest';
import { generate } from './index';
import fs from 'fs';
import path from 'path';

describe('generateConfig', () => {
  function createTestEnv(testName: string) {
    const testDir = path.join(__dirname, 'test-fixtures', testName);
    const routesDir = path.join(testDir, 'routes');
    const outputDir = path.join(testDir, 'output');
    
    // 디렉토리 생성
    fs.mkdirSync(routesDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    
    // 기본 테스트 파일들 생성
    fs.writeFileSync(
      path.join(routesDir, 'user.route.ts'),
      'export default class UserRoute { }'
    );
    fs.writeFileSync(
      path.join(routesDir, 'admin.route.ts'),
      'export default class AdminRoute { }'
    );
    
    return { testDir, routesDir, outputDir };
  }

  test('기본 import 생성', async () => {
    const { testDir, outputDir } = createTestEnv('default-import');
    
    await generate({
      inputGlob: path.join(testDir, 'routes/*.route.ts'),
      outputFile: path.join(outputDir, 'routes.ts'),
      baseDir: testDir,
      varName: 'routes',
      specificKeyword: 'route',
      write: (writer, classes) => {
        writer.write('{');
        writer.indent(() => {
          classes.forEach(({ className, path }) => {
            writer.writeLine(`${className}: {`);
            writer.indent(() => {
              writer.writeLine(`class: ${className},`);
              writer.writeLine(`path: '${path}',`);
            });
            writer.writeLine(`},`);
          });
        });
        writer.write('}');
      }
    });

    const output = fs.readFileSync(path.join(outputDir, 'routes.ts'), 'utf-8');
    
    expect(output).toContain('import UserRoute from');
    expect(output).toContain('import AdminRoute from');
    expect(output).toContain("export const keys = ['AdminRoute', 'UserRoute'] as const;");
    expect(output).toContain('export const routes = {');
    expect(output).toContain('AdminRoute: {');
    expect(output).toContain('UserRoute: {');
    expect(output).toContain('class: UserRoute,');
    expect(output).toContain('class: AdminRoute,');
    expect(output).toContain("path: 'routes/user.route',");
    expect(output).toContain("path: 'routes/admin.route',");
  });

  test('type-only import 생성', async () => {
    const { testDir, outputDir } = createTestEnv('type-import');
    
    await generate({
      inputGlob: path.join(testDir, 'routes/*.route.ts'),
      outputFile: path.join(outputDir, 'routes.ts'),
      baseDir: testDir,
      varName: 'routes',
      specificKeyword: 'route',
      importType: 'type',
      write: (writer, classes) => {
        // type의 경우 write 함수는 사용되지 않음
        writer.write('{}');
      }
    });

    const output = fs.readFileSync(path.join(outputDir, 'routes.ts'), 'utf-8');
    
    expect(output).toContain('import type UserRoute from');
    expect(output).toContain('import type AdminRoute from');
    expect(output).toContain("export const keys = ['AdminRoute', 'UserRoute'] as const;");
    expect(output).toContain('export interface Routes {');
    expect(output).toContain('AdminRoute: AdminRoute;');
    expect(output).toContain('UserRoute: UserRoute;');
  });

  test('익명 클래스 이름 생성', async () => {
    const { testDir, routesDir, outputDir } = createTestEnv('anonymous-class');
    
    // 익명 클래스 파일 생성  
    fs.writeFileSync(
      path.join(routesDir, 'user-profile.route.ts'),
      'export default class { }'
    );

    await generate({
      inputGlob: path.join(testDir, 'routes/*.route.ts'),
      outputFile: path.join(outputDir, 'routes.ts'),
      baseDir: testDir,
      varName: 'routes',
      specificKeyword: 'route',
      write: (writer, classes) => {
        writer.write('{');
        writer.indent(() => {
          classes.forEach(({ className, path }) => {
            writer.writeLine(`${className}: {`);
            writer.indent(() => {
              writer.writeLine(`class: ${className},`);
              writer.writeLine(`path: '${path}',`);
            });
            writer.writeLine(`},`);
          });
        });
        writer.write('}');
      }
    });

    const output = fs.readFileSync(path.join(outputDir, 'routes.ts'), 'utf-8');
    expect(output).toContain('UserProfileRoute');
    expect(output).toContain("export const keys = ['AdminRoute', 'UserProfileRoute', 'UserRoute'] as const;");
    expect(output).toContain('export const routes = {');
  });

  test('export class 형태 지원', async () => {
    const { testDir, routesDir, outputDir } = createTestEnv('export-class');
    
    // export class 파일 생성
    fs.writeFileSync(
      path.join(routesDir, 'export-class.route.ts'),
      'export class ExportClassRoute { }'
    );

    await generate({
      inputGlob: path.join(testDir, 'routes/*.route.ts'),
      outputFile: path.join(outputDir, 'routes.ts'),
      baseDir: testDir,
      varName: 'routes',
      specificKeyword: 'route',
      write: (writer, classes) => { 
        writer.write('{');
        writer.indent(() => {
          classes.forEach(({ className, path }) => {
            writer.writeLine(`${className}: {`);
            writer.indent(() => {
              writer.writeLine(`class: ${className},` );
              writer.writeLine(`path: '${path}',`);
            });
            writer.writeLine(`},`);
          });
        });
        writer.write('}');
      }
    });

    const output = fs.readFileSync(path.join(outputDir, 'routes.ts'), 'utf-8');
    
    expect(output).toContain('import { ExportClassRoute } from');
    expect(output).toContain("export const keys = ['AdminRoute', 'ExportClassRoute', 'UserRoute'] as const;");
    expect(output).toContain('ExportClassRoute: {');
    expect(output).toContain('class: ExportClassRoute,');
  });

  test('named export 구문 지원', async () => {
    const { testDir, routesDir, outputDir } = createTestEnv('named-export');
    
    // named export 파일 생성 good!
    fs.writeFileSync(
      path.join(routesDir, 'named-export.route.ts'),
      'class NamedExportRoute { } export { NamedExportRoute };'
    );

    await generate({
      inputGlob: path.join(testDir, 'routes/*.route.ts'),
      outputFile: path.join(outputDir, 'routes.ts'),
      baseDir: testDir,
      varName: 'routes',
      specificKeyword: 'route',
      write: (writer, classes) => {
        writer.write('{');
        writer.indent(() => {
          classes.forEach(({ className, path }) => {
            writer.writeLine(`${className}: {`);
            writer.indent(() => {
              writer.writeLine(`class: ${className},`);
              writer.writeLine(`path: '${path}',`);
            });
            writer.writeLine(`},`);
          });
        });
        writer.write('}');
      }
    });

    const output = fs.readFileSync(path.join(outputDir, 'routes.ts'), 'utf-8');
    
    expect(output).toContain('import { NamedExportRoute } from');
    expect(output).toContain("export const keys = ['AdminRoute', 'NamedExportRoute', 'UserRoute'] as const;");
    expect(output).toContain('NamedExportRoute: {');
    expect(output).toContain('class: NamedExportRoute,');
  });

  test('export class type-only import', async () => {
    const { testDir, routesDir, outputDir } = createTestEnv('export-class-type');
    
    // export class 파일 생성
    fs.writeFileSync(
      path.join(routesDir, 'export-class-type.route.ts'),
      'export class ExportClassTypeRoute { }'
    );

    await generate({
      inputGlob: path.join(testDir, 'routes/*.route.ts'),
      outputFile: path.join(outputDir, 'routes.ts'),
      baseDir: testDir,
      varName: 'routes',
      specificKeyword: 'route',
      importType: 'type',
      write: (writer, classes) => {
        writer.write('{}');
      }
    });

    const output = fs.readFileSync(path.join(outputDir, 'routes.ts'), 'utf-8');
    
    expect(output).toContain('import type { ExportClassTypeRoute } from');
    expect(output).toContain("export const keys = ['AdminRoute', 'ExportClassTypeRoute', 'UserRoute'] as const;");
    expect(output).toContain('export interface Routes {');
    expect(output).toContain('ExportClassTypeRoute: ExportClassTypeRoute;');
  });

  test('export되지 않은 클래스는 경고하고 건너뛰기', async () => {
    const { testDir, outputDir } = createTestEnv('no-export-warning');
    
    // export되는 클래스와 export되지 않은 클래스 파일 생성
    fs.writeFileSync(
      path.join(testDir, 'routes', 'valid.route.ts'),
      'export default class ValidRoute { }'
    );
    fs.writeFileSync(
      path.join(testDir, 'routes', 'invalid.route.ts'),
      'class InvalidRoute { }'
    );

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await generate({
      inputGlob: path.join(testDir, 'routes/*.route.ts'),
      outputFile: path.join(outputDir, 'routes.ts'),
      baseDir: testDir,
      varName: 'routes',
      specificKeyword: 'route',
      write: (writer, classes) => {
        writer.write('{');
        writer.indent(() => {
          classes.forEach(({ className, path }) => {
            writer.writeLine(`${className}: {`);
            writer.indent(() => {
              writer.writeLine(`class: ${className},`);
              writer.writeLine(`path: '${path}',`);
            });
            writer.writeLine(`},`);
          });
        });
        writer.write('}');
      }
    });

    const output = fs.readFileSync(path.join(outputDir, 'routes.ts'), 'utf-8');
    
    // ValidRoute만 포함되어야 함
    expect(output).toContain('ValidRoute');
    expect(output).not.toContain('InvalidRoute');
    expect(output).toContain("export const keys = ['AdminRoute', 'UserRoute', 'ValidRoute'] as const;");
    
    // 경고 메시지 확인
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No exported class found in')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('invalid.route.ts')
    );
    
    consoleSpy.mockRestore();
  });
});