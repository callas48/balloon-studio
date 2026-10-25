# 긍정 가치 유리 — 승인 시안 적용

## 에셋과 동작

| 테마 | 예시 이름 | 실제 PNG |
| --- | --- | --- |
| blue | 정의감 | `public/pixel-rpg/positive-blue-pair.png` |
| pink | 사랑 | `public/pixel-rpg/positive-pink-pair.png` |
| orange | 우정 | `public/pixel-rpg/positive-orange-pair.png` |

각 PNG는100% 전용/일반 유리 두 프레임만 담은 투명1024×420 시트다. scripts/pack-positive-glass.cjs가 이전 승인 시트에서 두 프레임을 무손실로 패킹한다. 나머지4단계 그림은 런타임에서 로드하지 않는다. 기존6상태 원본은 참고와 재생성용으로 보존한다.

100%는 별도 찬란한 상태.0~99%는 동일 일반 질감의 가로 clip만 바꾸면서 명도·대비·채도를 연속으로 낮춘다. 고정 Voronoi11조각과 연결된 균열이 수치에 따라 자라고, 후반부에 유리와 글자가 함께 벌어지고 회전하며 일부 조각이 아래로 밀려난다. 모든 기하가 수치에 의해서만 결정되므로 슬라이더 역방향·JSON·PNG·썸네일에서 일치한다. 시간 기반 자동 재생이나 GIF 출력 기능은 아니다.

실제 range 슬라이더는 input마다 live render하고 드래그당 Undo1회, pointercancel에서 원래 수치를 복원한다. 하단 독립 입력에서도 동일하다. 명도/대비 변화가 먼저 일어나고 균열→조각 분리→낙하 순서로 진행한다.

`public/pixel-rpg-positive.js`가 로드/캐시/렌더/프리셋을 담당하며, `public/pixel-rpg.js`에서 기존 로드·렌더·속성 편집과 연결한다. 새 기본 이름은 정의감. 기존 파일의 사용자 이름은 유지한다. 색상 프리셋 버튼을 누를 때만 예시 이름까지 한 Undo로 적용한다. `pixelPositiveTheme` 누락은 blue, legacy 선택은 이전 어두운 유리 렌더다. `pixelLowerShatter=false`는 혼탁/파손을 끄고 빛의 수치 감소는 유지한다.

## 제작 기록

Built-in image_gen 편집 사용. 사용자 승인한 컬러별 시안을 각각 입력하고 다음 공통 프롬프트로 글자 없는 에셋을 제작했다. 글자/숫자는 앱에서 다시 그리므로 PNG 문구에 고정되지 않는다.

```text
Production asset preparation of this exact approved RPG concept sheet. Keep the canvas size, exact 3-column 2-row grid layout and exact positions, dimensions, silhouettes, decorative gold frames, gemstones, colors, glow, glass surfaces, fracture patterns and six progression states. Remove ALL text everywhere: all captions above frames, all Korean words inside frames, ALL percentages and numbers inside frames, including fragments of letters in the broken stage. Seamlessly reconstruct the matching glass texture behind all removed lettering. The six plaques must be EMPTY of lettering, ready for editable text drawn by the app. Make the outside backdrop fully transparent, including blank margins and outside golden frame silhouettes, and make actual missing-glass holes at the shattered state fully transparent. Preserve the colored dark glass where glass still exists, and preserve fine luminous cracks and shards. Maintain pristine radiant100, bright90, cloudy70, murky50, dim30 and shattered0 art states in the same original positions. Do not redesign or rearrange or add items; no labels, no white writing, no letters, no numbers, no watermarks. Keep both upper and lower glass panels in every plaque.
```

## 검증

`tests/pixel-rpg-positive.cjs`: 실제 PNG와 native Canvas로 3색·두 원본·연속 명도/대비·고정 질감/가변 clip·조각 면적·역방향 재계산 픽셀 일치·슬라이더 Undo/취소·투명 구멍·이름 변경·JSON 일치·프리셋 Undo·busy/stale·연동/독립 수치·드래그 취소를 검사한다. `tests/pixel-rpg.cjs`는 legacy 경로를 계속 검사한다. 실제 렌더 확대 비교는 `positive-render-preview.png`. 실제 브라우저/휴대폰 검증은 하지 못했다.


## v208 배포 산출물 오류와 재발 방지

v208 공개 HTML과 실제 배포 tar의 HTML에 새 모듈 태그가 없었던 문제를 확인했다. 소스 HTML에 태그가 있다는 검사만으로 배포 연결을 검증할 수 없다. 이제 빌드에서 `scripts/check-deployment-entry.cjs`로 산출물 HTML/69개 스크립트/Worker 내장 HTML/PNG 일치를 검사하고, 최종 배포 tar도 동일 검사한다. `PIXEL_RPG_TEST_ROOT=dist/client node tests/pixel-rpg-positive.cjs`는 실제 배포 HTML이 참조하는 파일과 PNG로 네이티브 렌더를 실행한다.


## 받침판

파손 유리 뒤에 불투명 무광 판을 배치한다. 조각은 독립적으로 이동하지만 그 틈으로 그림이 비치지 않고 판이 보인다. 판→유리·글자 조각→금색 프레임 순서이며, 윗 게이지와 하단 왕관 사이도 받침 목으로 연결한다. 테스트는 3색100/35/0%에서 판 alpha255, 서로 다른 배경의 안쪽 픽셀 일치와 외곽 캔버스 투명성을 확인한다.
