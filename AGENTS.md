# Agents 가이드

- 프로젝트 전체의 컨벤션 변경사항 등을 이 파일에 업데이트할 것

## 패키지 관리

- **절대 package.json을 직접 수정하지 말 것**
- 패키지 설치는 반드시 `bun add -D` 명령어 사용 (build될것이므로 모든 의존성은 devDependencies)
- 패키지 제거는 `bun remove` 명령어 사용

## 데이터베이스 스키마

### 테이블 정의

- 테이블 변수명: **PascalCase** 사용 (예: `Users`, `Emails`, `OidcClients`)
- 모든 테이블은 `id`를 Primary Key로 가짐
- ID는 ulidx 기반이며 `$defaultFn(() => ulid())`로 기본값 설정
- ID 타입은 `@src/lib/server/db/types.ts`의 커스텀 `ulid` 타입 사용
- Timestamp는 `@src/lib/server/db/types.ts`의 커스텀 `timestamp` 타입 사용
  - 기본값은 `sql\`now()\`` 사용

### 컬럼 정의

- **boolean 대신 enum 사용** (제3의 상태 발생 가능성 고려)
- **Foreign key에서 `onDelete: 'cascade'` 사용 금지**

### Enum 정의

1. `lib/enums.ts`에 상수 객체 정의:

```typescript
export const EmailState = {
  UNVERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED',
  PRIMARY: 'PRIMARY',
} as const;
export type EmailState = keyof typeof EmailState;
```

2. `lib/server/db/enums.ts`에 pgEnum 정의:

```typescript
function createPgEnum<T extends string>(enumName: string, obj: Record<string, T>) {
  return pgEnum(enumName, Object.values(obj) as [T, ...T[]]);
}

export const _EmailState = createPgEnum('_email_state', E.EmailState);
```

3. `lib/server/db/schema.ts`에서 사용:

```typescript
import * as E from './enums';
state: E._EmailState('state').notNull().default(EmailState.UNVERIFIED);
```

### 데이터베이스 작업

- **ID를 미리 생성하지 말 것**
- Insert 시 `.returning()`으로 생성된 데이터 받기
- 단일 레코드: `.then(firstOrThrow)` 사용
- 예시:

```typescript
const user = await db.insert(Users).values({ nickname: 'test' }).returning().then(firstOrThrow);
```

## SvelteKit 아키텍처

### API 구조

- **API 엔드포인트 (+server.ts) 대신 form actions 사용**
- 과도한 추상화 지양 - 로직을 별도 파일로 분리하지 말고 `+page.server.ts`에 직접 작성

### 폼 검증

- **superforms + zod 4 사용**
- 검증 스키마는 모듈 최상단에 정의
- load 함수에서 `superValidate(zod4(schema))` 사용
- actions에서 `superValidate(request, zod4(schema))` 사용

### Svelte 5 규칙

- 타입 추론 사용 (명시적 타입 선언 최소화)

## 코드 스타일

- 코드가 자체 문서화되도록 작성
- 설명이 필요한 경우에만 주석 추가

## UI/스타일링

- **Tailwind 4 사용**
- **shadcn-svelte 컴포넌트 사용**
- shadcn 컴포넌트 설치 예시:

```bash
bun x shadcn-svelte@latest add $componentName
```

## 응답 언어

- **모든 응답과 메모리는 한국어로 작성**
