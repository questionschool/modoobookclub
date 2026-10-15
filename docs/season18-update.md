# 시즌 18 사이트 업데이트 목록

2026-10-16 · 모두의 새벽 + 낭만북클럽

운영 주소: https://bookclub.questionschool.net/

## 교체한 파일

| 파일 | 변경 내용 |
|---|---|
| `index.html` | 통합 모임 소개 홈, 시즌 18 모집 연결, 역순 책장, 진행자·참가 안내 |
| `README.md` | GitHub Pages·Google 저장 구조와 유지보수 방법 |

## 새로 추가한 페이지·기능

| 파일 | 역할 |
|---|---|
| `index17.html` | 기존 `index.html`을 내용 변경 없이 보존한 시즌 17 홈 |
| `about.html` | 모임 소개 |
| `guide.html` | 처음 참여하는 분을 위한 절차·FAQ·카카오톡 문의 |
| `archive.html` | 함께 읽어 온 18개 시즌의 책과 기록 |
| `welcome_18.html` | 『뉴런하우스』 모집 안내·신청서·공개 인사 목록 |
| `author_18.html` | 김정규 작가 소개와 주요 저서 |
| `club.css` | 하일렌의 노랑·청록을 활용한 공통 디자인, 모바일 대응 |
| `club.js` | 메뉴와 책장 동작 |
| `archive.js` | 시즌별 간결한 기록 펼치기 |
| `signup.js` | Google Apps Script 신청 저장·접수 확인·공개 인사 조회 |
| `favicon.svg` | 사이트 아이콘 |
| `.nojekyll` | GitHub Pages에서 정적 파일을 그대로 제공 |
| `about/index.html`, `guide/index.html`, `archive/index.html`, `welcome_18/index.html`, `author_18/index.html` | 확장자 없는 공유 주소를 해당 HTML로 연결, 쿼리·위치 보존 및 공유 정보 제공 |
| `tools/og-season18.html` | 공유 이미지의 편집 가능한 HTML 원본 |
| `tools/render-share-image.cjs` | 공유용 JPEG 출력 도구 — 사이트 운영에는 필요하지 않음 |
| `docs/season18-update.md` | 이 파일 목록 |

## 이번에 올린 이미지 13개

기존 저장소의 이미지 폴더와 파일은 유지하고, 새 사이트에서 사용하는 이미지를 `assets/`에 추가했습니다.

| 파일 | 활용·출처 |
|---|---|
| `assets/og-season18-v1.jpg` | 신규 SNS 공유 이미지 · 1200×630 · 『뉴런하우스』 표지와 하일렌 색감 · 이름은 **모두의 새벽 + 낭만북클럽** 순서 |
| `assets/neuronhouse-cover.jpg` | 제공된 『뉴런하우스』 표지 |
| `assets/heilen-02.jpg` | 게슈탈트 하일렌 공식 시설 사진 |
| `assets/heilen-03.jpg` | 게슈탈트 하일렌 공식 시설 사진 |
| `assets/heilen-04.jpg` | 게슈탈트 하일렌 공식 시설 사진 |
| `assets/kim-jungkyu-watercolor-v1.png` | 제공 사진을 바탕으로 앞서 제작한 작가 수채화 이미지 |
| `assets/conversation.webp` | 기존 소개 시안의 온라인 낭독 삽화 |
| `assets/mv-conversation.webp` | 낭만책사 뮤직비디오 작업물의 대화 장면 |
| `assets/mv-host-jipyeong.webp` | 낭만책사 뮤직비디오 작업물의 지평 캐릭터 |
| `assets/mv-host-nongdam.webp` | 낭만책사 뮤직비디오 작업물의 농담 캐릭터 |
| `assets/mv-writing-room.webp` | 낭만책사 뮤직비디오 작업물의 작업실 장면 |
| `assets/dawn-first-day.jpg` | 지평의 블로그 · 『원청』 첫날 새벽 사진 |
| `assets/wencheng-books.jpg` | 지평의 블로그 · 『원청』 도서 사진 |

하일렌 사진: https://www.gestalt.co.kr/bbs/content.php?co_id=gestaltheilen05
블로그 사진: https://blog.naver.com/gestaltcoach/224404176039 · https://blog.naver.com/gestaltcoach/224391156164

## 기존 기록 보존

기존 `index.html`은 `index17.html`에 바이트 단위로 동일하게 보존했습니다.

SHA-256: `52cd8fbc7956d10592a16d0b9b4993382b696d8d4e8de3fc2baab5c78b7a0e8a`

`history.html`, 시즌 15~17 모집 페이지, 저널·개인 기록·수정 페이지, 기존 이미지와 `CNAME`은 변경하지 않았습니다. 새 사이트 하단에서도 시즌 17 홈과 진행 중인 기록으로 이동할 수 있습니다.

## ChatGPT 없이 운영되는 구조

웹사이트와 이미지는 이 GitHub 저장소에서 제공하고, 참가 신청 원본은 기존 Google 스프레드시트의 `참가자` 탭에 저장합니다. 시즌 값 `18`로 이전 신청과 구분합니다. ChatGPT 구독·로그인·API와 로컬 서버가 필요하지 않습니다. GitHub Pages, 사용자 도메인, Google 계정과 기존 Apps Script 배포를 유지하면 됩니다.

기존 Apps Script 웹앱은 같은 URL로 업데이트했습니다. 신청서의 본명·연락처는 시트에 보존하고, 공개 조회 응답에는 보내지 않도록 수정했습니다. 공개 인사에는 별칭·자기소개·인사말만 표시합니다. 기존 운영자 신청 알림 동작은 유지합니다.

메인 페이지와 시즌 18 안내를 포함한 주요 페이지·연결 페이지에 Open Graph와 Twitter 카드 정보를 정적으로 넣었습니다. SNS에서 이미 저장해 둔 미리보기는 서비스의 캐시 갱신이 필요할 수 있습니다.

## 신청 저장 검증

2026-10-16 로컬 미리보기의 실제 신청서를 통해 임시 시험 신청 1건을 전송했습니다. Google 스프레드시트에 시즌 18로 저장되고, 화면에 접수 완료와 별칭·인사말이 표시되는 것을 확인했습니다. 확인 뒤 시험 데이터만 지웠으며 시트가 비어 있는 것도 대조했습니다. 신청서의 글자 수 제한은 기존 Google 저장 한도와 맞췄습니다.
