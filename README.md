# Dear .

한국인과 일본인이 서로의 언어로 교환일기를 쓰며 배우는 언어 교환 앱.

## 폴더 구조

```
Dear/
├─ frontend/   Expo(React Native) 앱
├─ backend/    Spring Boot + MySQL 서버
│   └─ src/main/resources/db/migration/   DB 스키마(V1__init.sql ...)
└─ docs/       기획서·요구사항·API·DB 명세
```

## 실행 방법

### 프런트
```bash
cd frontend
cp .env.example .env     # EXPO_PUBLIC_API_URL 이 비어 있으면 mock 모드
npm install
npx expo start
```

### 백엔드
MySQL 8.0.16 이상에 `dear` DB를 만들고 `backend/.env` 를 작성한다.
```properties
DB_USERNAME=...
DB_PASSWORD=...
GOOGLE_CLIENT_ID=...
```
```bash
cd backend
./gradlew bootRun
```
DB 스키마는 `backend/src/main/resources/db/migration/V1__init.sql` 을 실행해 만든다.
