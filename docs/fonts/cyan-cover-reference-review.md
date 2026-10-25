# 로판 표지 서체·배치 참고 검토 (2026-10-25)

사용자 원문: https://cyanindesign.blogspot.com/2020/05/blog-post.html
원문의 이미지 15개를 직접 확인했다. 원문도 서체 식별이 눈대중 추정이라고 명시한다. 표지 이미지·로고·작품명을 제품 자산으로 복제하지 않고 새로운 문구의 색상·크기·배치 연구로 구현했다.

| 원문 서체 | 공용 기본 글꼴 | 처리 |
| --- | --- | --- |
| 안삼열체 | HS봄바람체 2.0 | 보유 폰트 연결 |
| 빛의계승자체 | 카페24 클래식타입 | 재배포 제한, 보유 폰트 연결 |
| HS봄바람체 | HS봄바람체 2.0 | 기존 공식 파일·라이선스 사용 |
| 바람체 | 카페24 클래식타입 | 보유 폰트 연결 |
| Rix장미의유혹 Thorn | HS봄바람체 2.0 | 보유 폰트 연결 |
| Rix장미의유혹 Basic | 카페24 클래식타입 | 보유 폰트 연결 |
| 순명조 (a/MD 원문 추정) | 마루부리 SemiBold | 식별 미확정, 보유 폰트 연결 |
| 산돌 격동명조 | KoPubWorld Batang Bold | 보유 폰트 연결 |
| 블랑체 | 카페24 클래식타입 | 보유 폰트 연결 |
| 산돌 안단테 | 카페24 클래식타입 | 보유 폰트 연결 |
| 산돌 개화 | 국립박물관문화재단 클래식 B | 보유 폰트 연결 |
| 산돌 제비 Display | KoPubWorld Batang Bold | 보유 폰트 연결 |
| 산돌 제비 | 마루부리 Regular | 보유 폰트 연결 |
| 산돌 제비2 | 마루부리 SemiBold | 보유 폰트 연결 |
| 산돌 예일 | KoPubWorld Batang Medium | 보유 폰트 연결 |

신규 원본 폰트 파일은 추가하지 않았다. 유료 폰트를 공용 탑재하는 권한은 없으며, 빛의계승자는 공식 라이선스가 수정·편집·재배포에 서면동의를 요구한다. 앱은 참고 서체명/실제 기본 글꼴/연결한 개인 폰트를 구분한다. 다른 글꼴을 원본과 같다고 표시하지 않는다. 오래된 판매 링크 일부는404이므로 확인하지 못한 개별 상품 URL 대신 제작·배포처 홈으로 연결한다. 현재 가격·세부 상품권을 추정하지 않는다.

공식 검토:
- https://heiroflight.gamevil.com/ : Heir Font License의 재배포 제한 확인.
- https://www.sandollcloud.com/font/555/RixRoseLureThorn_Pro : 현재 공식 서체 페이지 확인.
- https://www.sandollcloud.com/font/254/Sandoll-GyeokdongMyeongjo : 공식 유료 서체/이용권 확인. 이미지 제작 허용과 원본 파일 공용 재배포는 구분한다.
- HS봄바람체 기존 검토 및 공식 동봉 자료: docs/fonts/cover-font-review.md, public/fonts/cover/.

## 구현과 검증
- romance-title-references.js: 15개 참고 항목, 6개 배치. 기존9개와 총24개. 폰트별·로판 레퍼런스·개별 참고 서체 필터.
- 각 제목은 서로 다른 크기/위치의 native text3개+objectGroup, 새 객체 스키마 없음. 문구·위치·색·너비·공용/보유 폰트 편집. 여러 줄 높이도 폰트 맞춤에 반영.
- 설정창 직접 업로드는 importFontFiles(applyToSelection:false)를 사용해 기존 선택 객체를 변경하지 않는다. 중복 파일도 기존 폰트로 연결. 가져오기 후 문서교체 가드. 재사용 보유 폰트 원본 바이트를 같은 Undo의 문서fonts에 동봉.
- tests/romance-title-references.cjs: 15종 실제 Canvas/24목록/필터/한Undo/그룹독립/JSON동일픽셀/320px/실제 업로드와 중복·기존 선택 보존/보관폰트 동봉/없는폰트·stale문서 가드.
- 15개 Canvas 미리보기 육안 확인. 기존 compound-title/cover-title/font-persistence/cover-fonts 및 editor audit24/24 통과. 실제 브라우저·모바일 터치는 미확인: 기존 Worker에는 지원 preview 진입점이 없으며 호스팅 설정을 QA 우회용으로 변경하지 않음.
