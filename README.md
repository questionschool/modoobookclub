# 모두의 새벽 + 낭만북클럽

운영 주소: https://bookclub.questionschool.net/

이 저장소의 정적 HTML·CSS·JavaScript와 이미지를 GitHub Pages에서 제공합니다. 사이트를 방문하거나 참가 신청을 하는 데 ChatGPT 계정·구독·OpenAI API가 필요하지 않습니다. 노트북이나 로컬 미리보기 서버를 켜 둘 필요도 없습니다.

## 운영 구조

- 웹사이트: GitHub Pages, `main` 브랜치의 루트 파일
- 도메인: `CNAME`에 지정된 `bookclub.questionschool.net`
- 참가 신청·인사: 기존 Google Apps Script 웹앱 → Google 스프레드시트 `참가자` 탭
- 시즌 18 신청: `welcome_18.html`의 신청서와 `signup.js`. 요청에 `season: 18`을 담아 기존 시즌 15~17 기록과 구분합니다.
- 기존 낭독 기록: `journal_17.html`, `my_journal_17.html` 등 기존 페이지와 Google 저장 서비스를 계속 사용합니다.
- 운영자 문의: 인커리G 카카오톡 채널

신청 원본은 Google 스프레드시트에 보관됩니다. 공개 인사 목록에는 별칭·자기소개·인사말을 표시하며, 이름과 연락처는 공개 응답에서 제외합니다. 저장 성공 응답을 받거나 실제 목록에서 접수가 확인된 경우에만 접수 완료로 안내합니다. 전송 결과가 불분명할 때는 자동으로 재전송하지 않습니다.

## 페이지 관리

| 파일 | 역할 |
|---|---|
| `index.html` | 통합 소개 홈과 시즌 18 안내 연결 |
| `index17.html` | 교체 전 시즌 17 홈페이지 원본 보존 |
| `about.html` | 모임 소개 |
| `guide.html` | 처음 참여하는 분을 위한 안내 |
| `archive.html`, `archive.js` | 시즌 18부터 역순 책장과 간결한 시즌 기록 |
| `welcome_18.html` | 시즌 18 모집·신청·인사 |
| `author_18.html` | 김정규 작가와 도서 소개 |
| `club.css`, `club.js` | 공통 디자인·메뉴·책장 동작 |

변경 파일과 이미지 전체 목록은 [시즌 18 업데이트 목록](docs/season18-update.md)을 확인하세요. 기존 `history.html`, `welcome_15.html`~`welcome_17.html`, 저널·개인 기록 페이지와 기존 이미지들은 보존했습니다.

## 수정 및 배포

파일을 수정해 `main`에 커밋·푸시하면 GitHub Pages에서 갱신됩니다. 별도 빌드나 설치가 없는 사이트입니다. `.nojekyll`은 정적 파일을 그대로 제공하기 위한 파일입니다. `CNAME`은 유지하세요.

로컬 확인:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

그런 다음 `http://127.0.0.1:8765/`를 여세요. 실제 신청서를 제출하면 운영 시트에 기록되므로, 일반 화면 점검에서는 제출하지 않습니다.

## SNS 공유 이미지

`assets/og-season18-v1.jpg`는 1200×630 JPEG입니다. 주요 페이지에 Open Graph와 Twitter 카드 정보를 직접 넣어, JavaScript 없이도 공유 서비스가 읽을 수 있습니다. 확장자가 없는 주소의 연결 페이지에도 같은 정보를 넣었습니다.

수정 가능한 원본은 `tools/og-season18.html`, 이미지 출력 도구는 `tools/render-share-image.cjs`입니다. 이미지 재생성 때만 Node.js·Playwright·Chrome이 필요하며, 배포된 사이트에는 필요하지 않습니다. 로컬 서버를 켜고 Playwright를 설치한 환경에서 `node tools/render-share-image.cjs`를 실행합니다. 필요한 경우 `PLAYWRIGHT_PACKAGE`로 설치 경로를 지정할 수 있습니다.

다음 시즌에 이미지를 바꿀 때는 새 파일명을 사용하고 각 페이지의 `og:image`, `twitter:image`를 함께 수정하세요. 공유 서비스에 이미 저장된 미리보기는 해당 서비스의 캐시 갱신이 필요할 수 있습니다.
