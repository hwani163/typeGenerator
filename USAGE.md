# Type Generator 사용법

## 📦 설치 방법

### 방법 1: GitHub Release로 설치 (추천)
```bash
# latest release에서 설치 (가장 간단!)
npm install https://github.com/hwani163/typeGenerator/releases/latest/download/dist.tar.gz

# 또는 특정 버전 설치
npm install https://github.com/hwani163/typeGenerator/releases/download/v1.0.0/dist.tar.gz
```

### 방법 2: Git URL로 설치
```bash
# release 브랜치 사용
npm install git+https://github.com/hwani163/typeGenerator.git#release

# 또는 latest 태그 사용
npm install git+https://github.com/hwani163/typeGenerator.git#latest
```

### 방법 2: GitHub Releases에서 다운로드
1. [GitHub Releases](https://github.com/hwani163/typeGenerator/releases) 방문
2. latest 릴리즈에서 `dist` 폴더 파일들 다운로드
3. 프로젝트에 복사

## 🚀 사용 예제

### 기본 사용법
```typescript
import { generate } from '@hwani163/type-generator';

await generate({
  inputGlob: './src/routes/*.route.ts',
  outputFile: './src/routes.ts',
  baseDir: './src',
  varName: 'routes',
  specificKeyword: 'Route',
  write: (writer, classes) => {
    writer.writeLine('export const routes = {');
    classes.forEach(({ className, path }) => {
      const routeName = className.replace('Route', '').toLowerCase();
      writer.writeLine(`  ${routeName}: () => import('${path}'),`);
    });
    writer.writeLine('};');
  }
});
```

### Express.js 라우터 자동 생성
```typescript
import { generate } from '@hwani163/type-generator';

await generate({
  inputGlob: './src/routes/*.route.ts',
  outputFile: './src/auto-routes.ts',
  baseDir: './src',
  varName: 'routes',
  specificKeyword: 'Route',
  write: (writer, classes) => {
    writer.writeLine("import { Router } from 'express';");
    writer.writeLine("export const router = Router();");
    writer.writeLine("");
    
    classes.forEach(({ className, path }) => {
      const routeName = className.replace('Route', '');
      writer.writeLine(`import { ${className} } from '${path}';`);
    });
    
    writer.writeLine("");
    classes.forEach(({ className }) => {
      const routeName = className.replace('Route', '').toLowerCase();
      writer.writeLine(`router.use('/${routeName}', new ${className}().router);`);
    });
  }
});
```

## 📋 옵션 설명

- `inputGlob`: 스캔할 파일 패턴
- `outputFile`: 생성할 파일 경로  
- `baseDir`: 기본 디렉토리
- `varName`: 변수명
- `specificKeyword`: 필터링할 키워드
- `importType`: 'default' | 'type' - import 타입
- `write`: 커스텀 코드 생성 함수

## 🎯 실제 프로젝트 적용

### package.json에 스크립트 추가
```json
{
  "scripts": {
    "generate:routes": "node generate-routes.js",
    "prebuild": "npm run generate:routes"
  }
}
```

### 빌드 프로세스에 통합
```bash
# 빌드 전 자동 생성
npm run generate:routes && npm run build
```

## 🔄 자동화 예제

```yaml
# .github/workflows/build.yml
- name: Install type-generator
  run: npm install git+https://github.com/hwani163/typeGenerator.git#release

- name: Generate types
  run: npm run generate:routes
```

## 🌟 왜 release 브랜치를 사용하나요?

- **main 브랜치**: 개발 파일들 포함 (index.ts, test 파일, tsconfig.json 등)
- **release 브랜치**: 배포용으로 깔끔 (dist 폴더 + package.json만)

release 브랜치를 사용하면 **더 가벼우고 깔끔한** 패키지를 받을 수 있습니다! 