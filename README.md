# 앱 배포 페이지

안드로이드와 아이폰 앱을 웹에서 업로드하고 다운로드할 수 있는 간단한 배포 페이지입니다.

## 기능

- **안드로이드 앱**: APK 또는 AAB 파일 업로드 및 다운로드
- **아이폰 앱**: IPA 파일 업로드 및 PLIST 자동 생성, PLIST를 통한 다운로드
  - PLIST 파일 선택 시 기존 파일 사용
  - PLIST 파일 미선택 시 앱 이름, Bundle ID, 버전 입력으로 자동 생성
- 각 플랫폼당 1개의 앱만 지원 (업로드 시 덮어쓰기)

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 서버 실행:
```bash
npm start
```

3. 브라우저에서 `http://localhost:3000` 접속

## 사용법

### 안드로이드 앱 배포
1. "안드로이드 앱" 섹션에서 APK 또는 AAB 파일 선택
2. "업로드" 버튼 클릭
3. 업로드 완료 후 "안드로이드 앱 다운로드" 링크가 활성화됨

### 아이폰 앱 배포
1. "아이폰 앱" 섹션에서 IPA 파일 선택
2. PLIST 파일 선택 또는 자동 생성 정보 입력:
   - **기존 PLIST 사용**: PLIST 파일을 직접 선택
   - **자동 생성**: 앱 이름, Bundle ID, 버전 입력 (예: com.example.app)
3. "업로드" 버튼 클릭
4. 업로드 완료 후 "아이폰 앱 다운로드" 링크가 활성화됨

## 파일 구조

```
/
├── index.html          # 메인 웹 페이지
├── server.js           # Express 서버
├── package.json        # 프로젝트 설정
├── uploads/            # 업로드된 파일 저장소
│   ├── android/        # 안드로이드 앱 파일
│   └── ios/            # 아이폰 앱 파일
└── public/             # 정적 파일
```

## 기술 스택

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **File Upload**: Multer