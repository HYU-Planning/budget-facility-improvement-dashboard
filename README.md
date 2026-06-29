# 2026 교육환경개선사업 심사 대시보드

한양대학교 16개 단과대학의 교육환경개선사업 신청서(PDF) 및 예산 정보를 관리하는 심사용 대시보드입니다.

## 라이브 페이지

https://hyu-planning.github.io/budget-facility-improvement-dashboard/

## 주요 기능

- **신청서 관리**: 대학별 PDF 신청서 업로드 및 인라인 뷰어
- **예산 정보 입력**: 사업명, 소요기간, 예산 항목(금액·비고) 입력
- **현황 대시보드**: 접수 완료/미접수 현황, 총 예산 실시간 집계
- **GitHub 배포**: 버튼 한 번으로 GitHub Pages에 자동 반영
- **CSV 내보내기**: 전체 현황을 CSV 파일로 다운로드

## 파일 구조

```
├── index.html   # 페이지 구조 + 저장된 데이터 (__preload__)
├── style.css    # 스타일 전체
└── app.js       # 비즈니스 로직 전체
```

## 데이터 저장 방식

외부 서버·DB 없이 동작합니다. 업로드된 PDF와 입력 데이터는 브라우저 메모리에 보관되며, **GitHub 배포** 버튼을 누르면 GitHub API를 통해 `index.html`에 데이터가 내장된 채로 저장소에 커밋됩니다.

```
PDF 업로드 + 정보 입력
        ↓ (브라우저 메모리)
  GitHub 배포 버튼 클릭
        ↓ (GitHub Contents API)
  index.html 자동 커밋 → Pages 반영 (1~2분 소요)
```

## 담당자 사용 방법

### 최초 1회: GitHub 토큰 설정

1. 페이지 우측 상단 **GitHub 설정** 버튼 클릭
2. GitHub Personal Access Token(Classic) 입력 후 저장
   - 발급: GitHub → Settings → Developer settings → **Personal access tokens → Tokens (classic)**
   - **Generate new token (classic)** → Scopes: `repo` 체크
   - 생성된 토큰(`ghp_`로 시작) 복사 후 입력

> **Fine-grained token은 조직 정책상 사용 불가.** Classic token을 사용해야 합니다.

### 일반 사용

1. 대학 카드 클릭 → PDF 업로드 및 사업 정보 입력
2. 작업 완료 후 **GitHub 배포** 버튼 클릭
3. 1~2분 후 라이브 페이지에 자동 반영

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Vanilla JavaScript (빌드 도구 없음) |
| PDF 렌더링 | [PDF.js](https://mozilla.github.io/pdf.js/) v3.11.174 |
| 아이콘 | [Tabler Icons](https://tabler.io/icons) v3.19.0 |
| 폰트 | Noto Sans KR (Google Fonts) |
| 호스팅 | GitHub Pages |
