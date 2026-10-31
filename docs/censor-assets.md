# 검열 에셋

2026-10-31 (Asia/Seoul).

## 구성과 조작

에셋 → 검열. 사각/원형 각 7종, 총 14종: 단색 검정, 흰 안개, 검은 연무, TV 노이즈, 다크 노이즈, 글리치 노이즈, CENSORED. 사각 CENSORED는 한 줄, 원형은 `CEN / SOR / ED` 세 줄이다. 사각/원형은 기본 비율이며 가로·세로 조절로 막대/타원처럼 쓸 수 있다.

흰 안개·검은 연무를 포함한 모든 검열 에셋은 기존 `opacity` 값을 공유한다. 아래 PC 선택 자동팝업은 기본14종의 규칙이며, 나중에 추가한 모자이크/블러/frost는 삽입1회 자동표시 후 PC/폰 더블클릭·더블탭으로 연다(docs/censor-resize-scope.md). PC(기존 mobileMedia 너비 기준)에서는 선택한 에셋 아래에 빠른 불투명도 팝업을 자동 표시한다. 화면 아래에 공간이 없으면 위로 배치하고 화면 안으로 제한한다. 폰은 기존 실제 더블탭 판별 경로로 같은 팝업을 연다. 팝업을 여는 손떼기에서 생기는 호환 클릭은 기존 miniOpeningRelease 보호를 재사용한다. 단일 탭·드래그·크기/회전 핸들·핀치는 팝업을 열지 않는다.

슬라이더는 0~100% 불투명도이며 낮출수록 투명하다. 연속 드래그 한 번에 checkpoint 한 번, 추가 변화는 dirty로 표시하고 바로 렌더한다. 다른 문서/선택으로 넘어간 오래된 입력, busy/숨김 항목 입력은 적용하지 않는다. 선택 해제·닫기·Escape에서 닫고 새 선택/명시적 열기로 다시 표시한다.

## 구현

- `public/censor-assets.js`: referenceBalloons에 충돌 없는 `censor-<style>-<rect|circle>` ID 14개와 collection=censor 등록. 기존 kind=asset, native 이동/크기/회전/그룹/복제/가시성/Undo 사용. PNG 고정 에셋과 달리 기본 contain-fit을 쓰지 않고 객체 w/h로 늘인다. 기존 8점 warp도 지원한다.
- 공유 loadReference/loadBalloonAssets/drawReferenceBalloon 경로에서 생성·로드·출력·썸네일을 통합한다. customAsset payload나 새 문서 필드는 만들지 않는다. JSON에는 assetId와 기존 geometry/opacity만 추가되며 텍스처 픽셀/Undo 이력을 넣지 않는다. 기존 v3 JSON 및 DB v2 자동저장 경로 유지.
- 시안의 안개/연무/노이즈를 재사용 가능한 code-native 텍스처로 구현했다. 시안 비교 보드의 배경이나 다른 칸을 잘라 사용하는 방식이 아니다. 외곽 alpha는 투명하며 TV 노이즈의 중심은 alpha255로 가린다. CENSORED는 간단한 벡터 대문자로 그려 시스템 폰트 대체·폰트 로딩에 따른 결과 차이를 피한다.
- 텍스처는 고정 seed의 유한 14종이며 애니메이션/매프레임 난수가 없다. referenceImages에 최초 한 번 캐시. 안개·연무는 작은 격자에서 생성 후 보간 확대해 메뉴 열기의 연산량을 줄인다. opacity 변경은 질감을 재생성하지 않는다. warp 경로도 외부 globalAlpha로 불투명도를 합성해 슬라이더마다 warp bitmap을 만들지 않는다. 기존 warp 캐시 8개 제한 유지.
- `public/censor-controls.js`: DOM 팝업만 추가, artwork export에 포함되지 않는다. 기존 range/opacityValue와 값 동기화, 기존 말풍선 빠른 편집과 검열 팝업 분리. 검열 에셋 선택 후 일반 텍스트 색상 입력이 다시 활성화되는 것을 검사한다.
- assets 탭 목록에 검열 추가, aria/키보드 순환 6종 모두 연결. 기존 기본/오곡전도사/히토미 켜라 목록에 중복 노출하지 않는다.

## 검증

`tests/censor-assets.cjs`: 14종 고유 ID/실제 Native Canvas 생성·alpha/TV 노이즈 중심 불투명/0~100% 합성/문구 세 줄/늘이기·warp, 실제 addReference 및 공통 add·checkpoint/JSON 동일 PNG, 전용 목록/키보드, PC 아래 위치, 실제 shared gesture detector의 모바일 단일탭·더블탭·드래그/호환 click 차단/새 입력 허용, 한 슬라이더 한 Undo와 실제 restore, 문서교체 stale/busy/hidden, 일반 글자색 복원 검사를 수행한다.

기존 mini-edit-gesture, pink-reactions, asset-warp-live-time, sticker-paper-opacity, multi-duplicate, project-memory-recovery, autosave-scheduling, editor-input-performance 및 editor audit24종 검사도 수행한다. 실제 렌더된 검열 14종 비교 시트를 육안 확인했다. 자동 DOM/이벤트 대역과 Native Canvas 검증이며 실제 모바일 터치 검증으로 표현하지 않는다.

managed preview는 기존 Worker 앱에 dev script/static.directory가 없어 시작할 수 없고 status=stopped였다. QA 우회용 운영 설정 변경은 하지 않았다. 실제 브라우저/휴대폰 검증과 MSI 설치형 반영은 별도다.

## 공개 반영

v253 archive-backed 배포 succeeded. 기능소스 `3b6769eb78779201270e2195ab126bc63580d681`, 배포 `appgdep_6ae508750d0c8191b76eac68485bb626`. npm build·dist 긍정유리·최종 tar88JS/HTML/Worker 일치 검사 통과. 실제 브라우저/휴대폰 검증과는 구분한다.
