# Type Generator

디렉토리를 탐색하여 자동으로 타입과 const를 생성하는 TypeScript 라이브러리입니다.

## 기능

- **다양한 export 방식 지원**: `export default class`, `export class`, `class {} export {}`
- **자동 import 생성**: default import와 named import 모두 지원
- **Type-only imports**: `importType: 'type'` 옵션으로 타입 전용 import 지원
- **익명 클래스 지원**: 파일명으로부터 클래스명 자동 생성
- **통합된 출력 형태**: keys 배열 + 인터페이스/객체 자동 생성
- **에러 처리**: export되지 않은 클래스는 경고 후 건너뛰기

## 설치

```bash
npm install type-generator
# 또는
yarn add type-generator
```

## 사용법

### 기본 사용 (Default Import)

```typescript
import { generateConfig } from 'type-generator';

await generateConfig({
  inputGlob: 'src/**/*.route.ts',
  outputFile: 'src/generated/routes.ts',
  baseDir: 'src',
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
```

### Type-only Import 사용

```typescript
await generateConfig({
  inputGlob: 'src/**/*.route.ts',
  outputFile: 'src/generated/routes.ts',
  baseDir: 'src',
  varName: 'routes',
  specificKeyword: 'route',
  importType: 'type', // 타입 전용 import
  write: (writer, classes) => {
    // type 모드에서는 write 함수가 사용되지 않음
    writer.write('{}');
  }
});
```

## 지원하는 Export 방식

```typescript
// 1. export default class
export default class UserRoute { }

// 2. export class  
export class UserRoute { }

// 3. named export
class UserRoute { }
export { UserRoute };

// 4. 익명 클래스 (파일명으로부터 클래스명 생성)
export default class { } // user-profile.route.ts → UserProfileRoute
```

## 출력 예시

### Default Import 모드
입력 파일들:
```
src/routes/
├── user.route.ts      (export default class UserRoute)
├── admin.route.ts     (export class AdminRoute)
```

생성되는 파일:
```typescript
import UserRoute from "../routes/user.route";
import { AdminRoute } from "../routes/admin.route";

export const keys = ['AdminRoute', 'UserRoute'] as const;
export const routes = {
  AdminRoute: {
    class: AdminRoute,
    path: 'routes/admin.route',
  },
  UserRoute: {
    class: UserRoute,
    path: 'routes/user.route',
  },
};
```

### Type Import 모드
```typescript
import type UserRoute from "../routes/user.route";
import type { AdminRoute } from "../routes/admin.route";

export const keys = ['AdminRoute', 'UserRoute'] as const;
export interface Routes {
  AdminRoute: AdminRoute;
  UserRoute: UserRoute;
}
```

## API

### GenerateOptions

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `inputGlob` | `string` | - | 스캔할 파일들의 glob 패턴 |
| `outputFile` | `string` | - | 생성될 출력 파일 경로 |
| `baseDir` | `string` | - | 기준 디렉토리 |
| `varName` | `string` | - | 생성될 변수명 |
| `specificKeyword` | `string` | - | 파일명에서 찾을 키워드 |
| `importType` | `'default' \| 'type'` | `'default'` | import 타입 (일반/타입 전용) |
| `write` | `function` | - | 커스텀 출력 작성 함수 |

### Write Function

```typescript
type WriteFunction = (
  writer: CodeBlockWriter,
  classes: { className: string, path: string }[]
) => void;
```

## 라이선스

MIT
