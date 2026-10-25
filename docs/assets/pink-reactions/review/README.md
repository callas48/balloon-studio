# 해상도·누끼 검토 — 2026-10-21

54종을 실제 `prepareSticker`(흰 바탕 변환 포함)로 렌더해 원본 source-6842.png와 비교했다. `before-1.png`–`before-3.png`, `after-1.png`–`after-3.png` 및 `decisions.json`에 근거를 보관한다.

- ID700–751의 원본 너비는 52–244px. 기본 삽입 너비320px와 목록의424px 표시보다 작고 확대 시 계단/흐림이 나타나므로52종을 가로·세로4배로 확대했다. ID752(616×916),753(716×550)은 충분하여 원본 그대로 유지했다.
- 51종은 Lanczos3 보간+약한 선명화다. 원본 필기체·색·하트를 유지하는 쪽을 우선했다. 픽셀 수 증가는 원본에 없던 세부 복원을 의미하지 않는다. 특히 움찔/분홍 뷰르르릇/츄읍/팡/응 등 원본이 흐린 항목은 확대 후에도 부드러운 획이 남는다.
- ID742 할짝♡는 원본에서 위쪽 하트와 ㅎ 획을 다시 분리했다. 종전 y536 상단 제한이 하트를 제외하고 획을 잘랐다. 이제 원본 좌표 영역724,501,166,197을 색상 지원 마스크로 분리하여16px 여백을 둔다. 하트까지 포함하므로 캔버스 비율은198:229로 바뀐다. 저장된 객체 x/y/w/h/회전은 수정하지 않지만 전체 구성을 담기 위해 보이는 글자 비율/크기는 달라질 수 있다.
- ID714 화아아아는 기존 복원 조각의 수평 절단과 낯선 직사각형 잔여물이 보였다. 원본의 마지막 글자가 이웃 뷰와 겹쳐 있으므로 단순 재분리로 온전한 획을 얻을 수 없어 Imagegen으로 단일 에셋을 복원·확대했다. 네 글자의 순서·흰 채움·분홍 외곽·세로 대각 구도·투명 배경을 확대 대조했다. 원본 픽셀 복원이 아니며 광채/획 곡선의 차이가 있다. `hwa-restored-master.png`는 생성 결과이며 원본 분리본은 보존했다.
- 흰 바탕 변환 대상704–711은 원본 검정 PNG에서 본체와 분리된 작은 성분을 제거한 뒤 확대했다. 바탕색 변환은 기존 whitePaper 런타임 경로 그대로다. 본체에 붙은 불규칙 경계는 임의의 새 도형으로 바꾸지 않았다.
- 나머지 잘림 의심 부분은 원본 겹침/획 모양과 구분했다. 모든 에셋의 누끼와 획을 완전히 복원했다고 판단하지 않는다. 예: 응의 원본 겹침이 있는 위쪽, 일부 종이 외곽은 여전히 원본 추출의 한계가 있다.

모든 ID/이름/컬렉션/색상 동작을 유지하고 새 -hd-v3.png URL로 캐시를 갱신한다. 원본 PNG,9종 -v2.png,원본 시트,원본 마스크와 baseline-catalog.json은 보존한다. 기존 객체의 저장 값은 자동 편집하지 않는다.

## 검증
- tests/pink-reactions-hd.cjs:52개 새URL·크기/54개 메타데이터/투명 외곽/native 로드·렌더·실제 비틀기/저장 geometry 무변경/비보정 원본과 축소복원 비교 통과.
- pink-reactions, pink-reactions-repair(보존된9종 원본 회귀), white-reaction-paper, sticker-paper-opacity, custom-assets 통과.
- build.mjs 및 dist/client pixel-rpg-positive 통과. npm 실행 파일이 없어 package.json의 동일 build 스크립트를 node로 직접 실행했다.
- asset-warp-live-time의 라이브 시간 픽셀변경 assertion은 Windows 검사 환경에 글꼴이 없어 최초 실패했다. Arial/sans-serif/sans를 Windows 원본 글꼴로 등록한 재검사에서 라이브 시간 및 잉크·불투명도·실제8점비틀기·Undo·JSON·크기변경캐시 검사를 모두 통과했다. 제품 소스 변경은 없으며 이번54종 비틀기도 HD 전용 검사에서 통과했다.
- 브라우저 열기는 시간초과로 실패하여 실제 PC/모바일 UI는 미확인이다. Canvas 검사를 브라우저 검사로 표현하지 않는다.
- 최종 archive의 현재 HTML/70개JS/유리3PNG/반응54PNG 바이트 일치를 배포 직전에 검사한다.

재현: NODE_PATH에 설치된 Node 패키지 경로를 설정하고 `node scripts/upscale-pink-reactions.cjs` 실행. 보존된 baseline을 읽으므로 중복4배 확대하지 않는다. `node scripts/review-pink-reactions.cjs before` 및 `after`로 시트를 다시 만든다.

## 공개 반영
2026-10-21 11:54 KST, v228 배포 성공. 배포 커밋 a5960ca74d07def79abd02a18a450017c077be35, deployment appgdep_6ad82914d14c8191b63b4c564fcb405f. 로컬 최종tar 검사 통과 후144MB 업로드가300초 timeout으로 실패하여 서버 source build 경로로 같은 커밋을 배포했다. 공개54PNG는HTTP200 및로컬과바이트일치. 공개카탈로그는 서버LF/WindowsCRLF 정규화 후 일치. 브라우저 UI 검증과 구분한다.
