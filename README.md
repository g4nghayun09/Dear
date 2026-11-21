# Dear.

한국인은 일본어로, 일본인은 한국어로 교환일기를 쓰고 서로 첨삭해 주는 언어 학습 앱

| 폴더 | 내용 | 기술 |
|---|---|---|
| `/` (`src/`, `package.json`) | 앱 | React Native (Expo, Expo Router) |
| `backend/dear/` | 서버 | Spring Boot 4, JPA, Flyway, Java 17 |
| (DB) | 데이터베이스 | MySQL 8.0 이상 |

## 처음 세팅

### 1. MySQL 준비 (둘 중 하나)

**Docker가 있을 때**
```bash
docker compose up -d
```

**MySQL을 직접 설치했을 때**: MySQL Workbench 등에서 아래 실행
```sql
CREATE DATABASE dear CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'dear'@'%' IDENTIFIED BY '비밀번호';
GRANT ALL PRIVILEGES ON dear.* TO 'dear'@'%';
```

### 2. 서버 실행 (JDK 17)
```bash
cd backend/dear
copy .env.example .env      # (macOS: cp) 그다음 .env 에 DB_USERNAME, DB_PASSWORD 채우기
gradlew.bat bootRun         # (macOS: ./gradlew bootRun)
```
- 서버를 켜면 Flyway가 `src/main/resources/db/migration/`의 `V1__`, `V2__` … 파일로 테이블을 만들거나 고칩니다.
- 이미 손으로 테이블을 만든 DB라면 V1은 건너뛰고 V2부터 실행합니다.

### 3. 앱 실행
```bash
npm install
copy .env.example .env      # EXPO_PUBLIC_API_URL 에 서버 노트북의 IP 적기 (ipconfig → IPv4 주소)
npx expo start
```
- `EXPO_PUBLIC_API_URL`을 비워 두면 **mock 모드**(서버 없이 가짜 데이터)로 실행됩니다.
- 폰에 **Expo Go**를 설치하고, 터미널에 나온 QR 코드를 찍으면 앱이 열립니다.
- 폰과 서버 노트북은 **같은 Wi-Fi**에 있어야 합니다. 안 되면 Windows 방화벽에서 8080 포트를 허용하세요.

### 4. 로그인 없이 기능 시연 (개발용)
- 서버 `.env`에 `DEV_AUTH=true` → 요청 헤더 `X-User-Id: 번호`로 그 사용자처럼 동작합니다.
- 앱 로그인 화면 아래 **"개발용 · 기능 시연"** (Expo Go에서만 보임) → 매칭 자동 시연, 학습 언어 검사 비교, 테스트 사용자로 매칭 화면 열기.
- 시연·배포 때는 반드시 `DEV_AUTH=false`.

## 규칙
- **DB 테이블 변경**: `V1__init.sql`은 고치지 않고 `V2__설명.sql`처럼 새 파일을 추가해 PR로 올립니다.
- **`.env`는 GitHub에 올리지 않습니다.** 값이 바뀌면 `.env.example`만 고칩니다.
- **API 응답**: 앱(`src/lib/api/real.js`)에 맞춰 snake_case(`match_id`), 상태 값은 소문자(`none`/`waiting`/`matched`), 오류는 `{ code, message }`.
- **브랜치**: 사람/기능별 브랜치 → PR → 리뷰 후 main에 merge

## 담당 코드 위치

| 기능 | 앱 | 서버 | 담당 |
|---|---|---|---|
| 로그인·가입 (P-002~P-004) | `src/app/login.js`, `signup.js`, `auth/` | (작업 중) | 강하윤 |
| 1:1 매칭 (P-005, API-006·007·008·020) | `src/app/match.js` | `backend/dear/.../match/` | 강태인 |
| 학습 언어 입력 제한 (FR-010) | `src/lib/languageCheck.js`, `useDiaryInputCheck.js`, `src/components/LanguageCheckNotice.js` | `backend/dear/.../language/LanguageValidator.java` | 강태인 |
| 일기 작성·전송 (P-007) | | | 강하윤 |
| 첨삭, 단어장·학습 | | | 홍재나 |

공통: 서버 호출 `src/lib/api/`, 오류 문구 `src/lib/errorMessage.js`, 서버 오류 형식 `backend/dear/.../common/`

### 일기 작성에서 입력 제한 쓰는 법
```js
// 앱 (P-007)
const lang = learningLang(profile.native_lang);   // 'ja' | 'ko'
const check = useDiaryInputCheck(content, lang);
<LanguageCheckNotice lang={lang} check={check} />
<Pressable disabled={!check.canSend} … />
```
```java
// 서버 (일기 전송 API)
languageValidator.validateDiary(request.content(), LanguageValidator.learningLangOf(nativeLang));
```
