# 표지용 폰트 검토 (2026-10-23)

사용자 참고: https://m.blog.naver.com/naraedesign_/223514660640
원문 제목: 웹소설 표지 제목 타이포그래피에 쓰이는 폰트와 효과 (2024-07-16).

| 서체 | 검토 / 처리 |
| --- | --- |
| HS봄바람체 2.0 | 가로·세로 획 대비가 큰 로맨스/판타지 제목용. 제작자 원문의 상업 이용·수정·재배포·프로그램 임베딩 허용 확인. 공식 첨부 TTF를 변환 없이 탑재. |
| 카페24 클래식타입 | 말려 들어가는 삐침의 우아한 제목용. 공식 사이트의 웹폰트·임베딩·재배포 허용 확인. 공식 v1.1 ZIP의 WOFF2 및 원본 라이선스 PDF 동봉. |
| 빛의 계승자체 | 판타지 장식성이 강함. 공식 사이트 사용범위 팝업에서 수정·편집·재배포에 권리자 서면동의 필요. 공용 번들 제외. |
| 310안삼열체 | 유료 서체. 구매자의 사용권으로 서비스 전체에 재배포할 수 있다고 볼 근거가 없으므로 번들 제외. |
| 블랑체 | 유료 서체. 동일하게 번들 제외. |
| Nymphette | 문자 대신 장식이 나오는 딩뱃 서체. 사용 무료와 배포 허용은 별개. Font Squirrel의 해당 서체 라이선스에 복제·재배포 금지 및 공인 배포처 제한 명시. 번들 제외. |

## 공식 출처
- HS 제작자: https://blog.naver.com/hp0/221074080319 (모바일 원문과 공식 TTF 확인)
- Cafe24: https://fonts.cafe24.com/ (공식 JS의 라이선스 안내 및 fonts_ko.json의 다운로드 URL 확인)
- Cafe24 공식 ZIP: https://img.cafe24.com/csdstatic/freefonts/download/kr/Cafe24Classictype-v1.1.zip
- 빛의 계승자: https://heiroflighteclipse.com2us.com/ko?r=p1 (popup-policy-use)
- 310안삼열체: https://markethiut.com/product/detail.html?product_no=79&cate_no=24&display_group=1
- 블랑: https://markethiut.com/product/detail.html?product_no=399&cate_no=24&display_group=1
- Nymphette 배포 라이선스: https://www.fontsquirrel.com/license/nymphette
- Nymphette 저자 표기: https://www.dafont.com/nymphette.font

## 구현
- 기존 COMIC_FONTS / ensureComicFont / 문서 로드·렌더 경로에 category=cover인 2종을 추가. 폰트는 필요할 때만 로드한다.
- 글꼴 미리보기의 전체/표지용/공용 폰트/불러온 폰트 필터와 이름 검색을 교차 적용한다. 공용에는 표지용도 포함한다.
- 기본 폰트 선택 목록에도 표지용 optgroup을 표시한다. 기존 폰트 ID와 사용자 업로드 데이터는 유지한다.
- tests/cover-fonts.cjs: 실제 폰트 등록·픽셀 렌더, 지연 로드, JSON 복원, 필터/검색·적용 checkpoint 경로 검사.
- 브라우저/모바일 시각 QA 미실시. Worker의 preview entrypoint 없음. VM/Canvas 검사와 배포 성공을 실제 기기 검증으로 표현하지 않는다.
