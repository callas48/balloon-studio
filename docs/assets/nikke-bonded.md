# 현재: Dynalight Bonded♡

사용자 폰트 비교 목록에서 Dynalight를 선택해 현재 렌더에 적용한다. 이전 PNG는 아래 작업 이력을 위한 참고 파일이며 현재 렌더에 쓰지 않는다.

- 공식 폰트: https://github.com/google/fonts/tree/main/ofl/dynalight
- 로컬 파일: public/fonts/dynalight/Dynalight-Regular.ttf, OFL.txt (SIL OFL1.1).
- 비교 이미지 출처(사용자 제공): https://m.blog.naver.com/designer_hyeon/221349589091
- 사용자 최종 승인한 과거 잉크 NIKKE_BONDED_INK=rgba(194,36,49,0.72), 36px Dynalight, (371,1354)에서 -0.55rad (기존 기준에 y=-16; X는 고정). 밑줄2개와 윤곽 하트 조합. Dynalight cmap과 실제 Bonded♡ 렌더 검사에서 하트 미지원 확인. 사용자 지시에 따라 마지막 d 끝획이 하트의 아래 꼭짓점으로 들어가고 오른쪽 상승→왼쪽 하강→흘리는 끝획 순으로 같은 회전좌표계에 그린다.
- builtinFontReady에서 로드. 기존 표시 모드/프로젝트/출력/썸네일 지원.

## 과거 PNG 작업 이력

# 니케 Bonded 투명 소재

- 파일: `public/nikke/bonded.png`.
- 입력: 사용자가 2026-10-17 제공한 `6538.jpg`의 실제 상담 버튼 빨간 Bonded 필기체.
- 처리: built-in imagegen background-extraction, transparent_background=true. 사용자 요청은 원본 누끼이며, 기존 수작업 벡터를 삭제하고 이미지 편집 결과를 사용한다. 생성형 이미지 편집 결과이므로 원본 픽셀을 수학적으로 동일하게 추출한 것으로 주장하지 않는다.
- 확인: 실제 PNG에 alpha=0 배경 존재, 불투명 픽셀의 빨강 계열 확인. 원본과 비슷한 기울기의 상담 버튼 좌측에 배치. 별도 밑줄 없음.
- 크기/농도: 720×1560 기준(365,1297,90,76), 원본 alpha 유지. v188의 45% 불투명도는 사용자 의도 오해로 취소. 로드 시 source-in으로 #d45a4a 다홍색에 맞추며 모든 alpha값 보존. 밑줄2개·하트도 같은 색으로 추가. X도 같은 비율로 조정.
- 사용: `ensureNikkeBonded()` 공유 로더. `nikkeBondedMode` auto/show/hide, 누락=auto. auto는 상담 일지 현재 값 5 이상. 숨김이면 X/덧쓰기도 함께 숨긴다.

## 편집 프롬프트
Use case: background-extraction. Edit target: attached screenshot. Extract ONLY the original red cursive word 'Bonded' appearing at x approximately 208 to 490, y 800 to 1040 on the dark consultation button. Remove every other pixel to genuine transparent alpha. Preserve the exact original B-o-n-d-e-d letter silhouettes, stroke widths, connections, red color, ascending diagonal angle and relative proportions. This is a faithful cutout, NOT a redraw or replacement font, not a redesign. Output one tightly framed isolated original word on transparent background with modest transparent margin. No button, no dark background, no Korean text, no phone chrome, no underline, no shadow, no added strokes. Preserve the original slightly soft screenshot edges; do not invent calligraphy.
