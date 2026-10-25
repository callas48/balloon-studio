# 말풍선 공방 — GitHub 이식 인수인계

갱신: 2026-10-25 (Asia/Seoul). 아래 운영 버전 기록은 원본의 과거 이력이며 이 저장소의 배포 상태가 아니다.

## 설치형 업데이트·오프라인 정책 — 합의 완료 / 구현 전
- 사용자 합의: 프로그램 실행당 시작 시 자동 버전 확인 1회만 수행. 실행 중 주기 확인·포커스/연결 복구 시 재확인·실패 후 자동 재시도 없음. 수동 확인은 사용자 클릭에만 반응한다. 인스톨러 설치, 새 버전 알림만 자동 수행, 클릭 시 차등 다운로드, 작업 저장 후 설치·재시작. 자동 다운로드·강제 재시작 없음. 전체 다운로드가 필요하면 알리고 사용자가 선택한다.
- 인터넷 미연결·DNS/시간초과/업데이트 서버 장애 시 자동 팝업·토스트·OS 알림을 띄우지 않고 편집·로컬 프로젝트 열기·저장·출력을 유지한다. 실행은 업데이트 응답을 기다리지 않는다. 수동 확인 시에만 설정 화면 안에 상태를 표시할 수 있다.
- 요구사항·구현 순서·오프라인/차등 다운로드 검증 기준은 docs/windows-desktop-plan.md. 이번 변경은 문서 기록이며 업데이터/설치 파일 구현이나 실제 오프라인 동작 검증 완료가 아니다.

## GitHub 전체 소스 이식 — main 연결 완료
- 대상: callas48/balloon-studio, private, main. 읽기/쓰기 권한 확인 완료. 계정 가입·앱 설치·저장소 생성을 반복 요청하지 않는다.
- 원본: Sites v249의 최신 소스 140161c56a2ac05b135644ef5d592baf1fbfe2c0. 별도 폴더에서 복구하고 scripts/prepare-github.mjs로 운영 .openai 설정/원본 Git 이력/운영자 allowlist를 분리했다. 기존 서비스 배포와 기존 PSD 진행 폴더는 수정하지 않았다.
- 이식 폴더에 소스·폰트·에셋과 SHA256 목록 GITHUB-SNAPSHOT.json을 보관한다. 바이너리 396개를 원본 바이트와 Git blob SHA로 검증해 전체 소스 트리에 연결했다. 초기 README/.gitignore 커밋을 부모로 보존한 source 커밋 0852d555f52b4ca9847c811c1ea8666cbabc094a를 main에 반영했다. 전체 파일 수는 644개(해시 목록 자체 포함)다.
- 준비 검사: 원본의 tests/github-preparation.cjs 통과. 로컬 서버 HTTP·폰트/MIME·읽기전용 API·경로/메서드 가드·독립 build·운영설정 분리·개별 파일 해시를 검사했다. Windows 로컬 브라우저에서 첫 화면·말풍선 생성·Undo 기록을 확인했고 오류 로그는 없었다. 기본 4173은 다른 작업이 사용 중이어서 4184/4185에서 확인했다. 실제 모바일 터치·Windows 설치형 검증과 구분한다. dist/client의 긍정 유리 실제 Canvas 검사도 통과했다. scripts/prepare-github.mjs의 재내보내기에서 import 중복·이전 manifest 자기 해시 문제를 고쳤고 tests/github-reexport.cjs로 두 번 연속 내보내기와 모든 해시를 확인했다.
- 원격 tree는 truncated=false, 파일 644개다. 경로/크기/Git SHA 대조에서 Canvas 검사가 검토용 preview PNG 한 장을 재생성한 차이를 확인해 원본으로 복원하고 해시 목록을 갱신했다. 최종 검증은 원격 tree 전체 경로/크기/Git SHA와 로컬 전체 SHA256 목록으로 수행한다. 최초 396개 한 번 트리 연결은 API 응답 시간제한으로 실패했지만 50개 단위 트리 조합으로 완료했다.
- Windows 설치형은 docs/windows-desktop-plan.md 순서로 이어간다. 실행 진입점/설치 파일/자동 업데이트/네이티브 파일 저장은 미구현. 현재 node scripts/dev-local.mjs로 Windows 로컬 웹 편집기를 실행한다.

## 로판 표지 레퍼런스 — 완료 / v249 공개 배포
- v249 archive-backed 공개 배포 성공. 기능커밋95bac70f792a7000fdef18c2b387c7b38063fddd, 배포ID appgdep_6add7bc0543881918772147d122f53a2. build/dist긍정유리/최종tar82JS 일치 통과.
- 사용자 cyanindesign 2020-05 원문의 이미지15개 확인. 신규 romance-title-references.js: 참고서체15항목/배치6종/기존포함24개. 실제 사용 기본글꼴·참고서체를 구분하며 유료/제한원본은 공용 번들하지 않음. HS봄바람체는 기존 공식파일 사용. 상세 docs/fonts/cyan-cover-reference-review.md.
- native text3개/objectGroup으로 크기·위치·문구·색 편집, 전용필터와 개별참고서체필터. 설정창에서 공용/보유 글꼴선택 및 파일 직접연결. importFontFiles 옵션false는 기존 선택 객체를 변경하지 않고 중복파일은 재사용, 비동기 문서변경 가드. 재사용 customfont를 한Undo 안에 문서fonts 동봉. 새 문서스키마 없음.
- 신규 romance-title-references 검사 및 기존 compound-title/cover-title/font-persistence/cover-fonts, editor audit24/24 통과. 실제 Canvas15종 육안 확인. 브라우저·실기기 터치 미확인. 이순신체 실제사용 재보고는 기존 미해결 항목 유지.

## 골드 조우 화면 / 입체 테두리 — 완료 / v248 공개 배포
- v248 archive-backed 공개 배포 성공. 기능커밋dc7ad581e718a8647caa13e9be5ecd6ed5bc3d5f, 배포ID appgdep_6add5fab2f888191951b1f47e5637bc7. build/dist긍정유리·최종tar81JS/HTML일치검사 통과.
- 사용자7070/7069의 트레이너/야생 배틀 시작 구도를 gamePreset7 선택 pokeGoldMode(trainer/wild/dialogue, 누락=dialogue)로 추가. public/pokemon-gold-battle.js, 기존Gold2카드+조우2카드, 기존preset0–9순서보존. 새장960×864; 현재장에서도160×144전체구도contain·폭/가로/세로위치 편집.
- y100의160×44대화창·상대L자(좌상)/내L자(우하)와각6칸. 노란색/×표시/검정칸을개별선택·표시토글. 트레이너기본양쪽파티/▼없음, 야생기본내파티/▼있음. 표시들은시각서식이며게임기절규칙을시뮬레이션하지않음.
- Gold대화창은pokeGoldBorder bevel(기본/누락)/simple 선택. 회색입체4층테두리는유지하고텍스트만native해상도에서alpha threshold해선명한도트로합성. 기존48px대화창/흑백simple도선택가능. 과거Gold파일의문구/위치/schema복원유지.
- 상대/내그림각각업로드·삭제·x/y/크기,alpha·비율유지/nearest·장면영역clip. 기존배경그림·흰바탕ON/OFF별도.30MB/16MP/URL길이검사·비동기문서/선택·busy가드. loadImageLayers/thumbnail/page PNG에서Gold이미지2종대기. src별읽기전용decoded캐시는복제/내보내기중이미지를잃지않게보관(16개동시프리로드회귀).
- 전용UI투명PNG는배경media·흰장면·인물이미지를제외하고테두리/대사/파티만출력. 일반page출력은그림포함. source7070/7069·원작캐릭터·블로그워터마크를번들하지않음.
- tests/pokemon-gold-battle.cjs: 실제catalog/add/한Undo·party12칸/흰바탕·입체테두리pixel/5비율·원본GBC좌표·실제입력/stale/busy/2그림alpha·geometry/비동기취소·native loader/JSON동일픽셀·공통복제배열독립/실제page·전용투명PNG/16그림프리로드 통과. Gold조우2종native Canvas육안확인. 기존pokemon-masters(Gold포함)/pokemon-sunmoon·editor audit24/24 회귀통과. 실제브라우저·모바일터치는미확인.

## 썬·문 대화 / 배틀창 — 완료 / v247 공개 배포
- v247 archive-backed 공개 배포 성공. 기능커밋5188e0cf23100b4f28bd5f81adc526692193c227, 배포ID appgdep_6add054b62f48191b4c3c1a40d16a54b. 최종tar80JS/HTML일치·build/dist긍정유리검사 통과.
- 사용자7060–7064 + 추가자체검색 반영. public/pokemon-sunmoon.js, gameui preset8(썬·문 대화)/9(배틀) 추가, 기존0–7보존. pokemon 공통 카탈로그 상단에 대화4종(이름표/일반/예·아니요/검은안내)·배틀3종(첨부형싱글/더블·본편청록HUD). docs/ui/pokemon-sunmoon-reference.md에 근거·차이·제한.
- 공식pokemon.co.jp 스크린샷에서 청록붓자국HP와파란메시지창을 확인해 첨부7064의도트배틀과구분. 출처불명 첨부를본편배틀로단정하지않음. 첨부원본/캐릭터/배경/워터마크는번들하지않고Canvas벡터/도트로재현.
- 대화: 이름/두줄문구·글자크기/흰·검은스타일·폭/가로·세로위치/이름표·붉은▼·2선택지/선택화살표. 배틀:4슬롯이름/성별/레벨1–100/타입2개/현재·최대HP(0–9999)/HP비율길이·초록/노랑/빨강/싱글더블/행동4문구·선택표시/시간/숫자표시. 배틀/선택메뉴는이미지용표시이며게임실행기능으로설명하지않음.
- 공통media upload·복제/삭제/투명PNG·Undo/stale/busy가드공유. 썬·문 기본신규장1600×960, 첨부형배틀1536×864·청록HUD1600×960; 기본현재장. 배틀은384×216/본편400×240구도를보존해contain,사진은해당구도안에cover. 바깥alpha0.
- game-ui.js/thumbnail/export에preset8/9라우팅과assets대기,loader에서9의갈무리9font보존. 대화8은경기천년제목M. 새필드는sun*/battle* 선택데이터, 배틀배열복제독립·입력시immutable교체. 기존기본폰트·골드·마스터즈문서자동변경없음.
- tests/pokemon-sunmoon.cjs: 실제카탈로그·현재/새장·한Undo/inspector입력·HP/메뉴/시간/표시/두줄overflow/stale·busy/형식검증/가로·세로여러비율/JSON동일픽셀/native loader·공통복제/공통page PNG와전용투명PNG검사 통과. 6종 native Canvas배치육안확인. editor audit24/24 통과. pokemon-masters(Gold포함)/mini-edit-gesture/game-dialogue-gradient회귀통과. 실제브라우저·모바일터치는미확인.

## 포켓몬 골드 대화창 — 완료 / v246 공개 배포
- v246 archive-backed 공개 배포 성공. 기능커밋d2584c62c74135150c6098d30b672ca7bb9ff043, 배포ID appgdep_6add009b75ac8191b1ca1bbd545270cc. editor audit24/24·build/dist긍정유리·최종tar79JS/원본Galmuri9TTF·OFL·출처바이트일치검사 통과.
- 포켓몬 category key는 pokemon 유지, 버튼·제목은 포켓몬으로 변경. Masters EX 2종 보존 + 골드 대화창만/배경포함2종을 위쪽에 추가. 기존장 기본, 선택시960×864 새장. 새장 체크는 Masters와 독립.
- gameui/gamePreset7, public/pokemon-gold.js. 원래0–6순서 보존. GBC160×144/하단160×48 비율, 각진 흑백2중테두리·2줄·▼를 native160×48 raster + nearest 확대. 글자는2색 threshold로 안티앨리어싱 제거. 그림 없으면 UI바깥alpha0. 원작 그림/캐릭터/폰트 파일을 추출해 넣지 않음.
- 갈무리9 공식 원본TTF(Version2.404) pixel_galmuri9 공용 등록, public/fonts/galmuri/OFL.md/SOURCE.txt 동봉. OpenType Sanitizer9.2.0 원본TTF검사 통과. 경기천년제목M 신규대사 기본과 Masters 폰트는 보존. loadImageLayers/비활성thumbnail/내보내기에서 Gold폰트를 기다리고 자동으로M으로 덮지 않게 분기.
- 기존 Pokemon inspector/upload/clone/delete/export 경로 공유. 골드 대사/도트글자크기/너비30–100%/가로·세로위치/▼표시·배경확대/위치 편집. 이름표/하단버튼은 Gold에서 표시하지 않음.2줄초과 live hint, 전용투명PNG는배경과흰page없이pokemon-gold-ui.png. common page export는그대로.
- tests/pokemon-masters.cjs 확장: Masters 회귀 + 실제도트폰트/2색픽셀·이중테두리/160기준y96·5개비율/카탈로그·현재장·새장·한Undo/실제입력·liveoverflow·stale/실제loadImageLayers의폰트보존·JSON동일픽셀/복제·fullpage·transparent PNG 검사 통과. 3종 실제Canvas출력 육안 확인. mini-edit-gesture/font-persistence 검사 통과. 실제 브라우저·모바일 터치는 미확인.
- 참고: RPGFan Pokemon-Gold-Silver-Screenshot-100.jpg (Gold/Silver 대화창), 갈무리 공식 https://github.com/quiple/galmuri (OFL1.1). v246 공개 URL은 기존과 동일.

## 빠른 편집 더블탭 직후 오입력 — 완료 / v245 공개 배포
- v245 archive-backed 공개 배포 성공. 기능커밋cbf24c8b3fae05003e6c464be3ba5e88f312cc54, 배포ID appgdep_6adcf6c7c6d88191845321d623040664. editor audit24/24·multi-move/panel-boundaries·build/dist긍정유리·최종tar78JS 일치 검사 통과.
- corner-fit.js에서 두 번째 touch/pen pointerup 즉시 popup을 열면서 뒤따르는 호환 mousedown/up·click/dblclick을 차단하지 않던 경로 보완. pointerup preventDefault만으로 click이 취소되지 않으며 새 popup 입력칸으로 재타깃될 수 있음. 실제 사용자 기기 발생 경로는 아직 미확인.
- openLayerMiniEditor에 선택 opening event 전달, window capture의 miniOpeningRelease로 창을 연 release에서 이어진 호환 이벤트를 소비. 새 실제 pointerdown/keydown 즉시 해제, 800ms 만료, detail0 키보드/프로그램click 허용. UI 전체 잠금 지연 없이 다음 터치/마우스 바로 사용, PC 더블클릭 유지. 문서·Undo·저장 형식 변경 없음.
- tests/mini-edit-gesture.cjs의 window→canvas→실제 popup 버튼 경로 추가. 수정 전 HEAD 소스로 오입력 방지 검사 실패 재현, 수정 후 close/쓰기방향/불투명/폰트/색상으로 재타깃된 호환 이벤트 차단·focus/Undo없음, 다음실터치/마우스/키보드·pen/만료 검사 통과. 기존56종 편집·rich-text/text-font-preference/color-picker 검사 통과.
- 실제 브라우저/모바일 실터치는 미확인. 기존 Worker 앱의 지원 preview 진입점 부재; 이벤트 시뮬레이션 결과를 실기기 확인으로 표현하지 않는다.

## 포켓몬 마스터즈 EX 대화창 — 완료 / v244 공개 배포
- v242 archive-backed 공개 배포 성공. 기능커밋c304d174bbd3010551ed4297402b118e9561d9d9, 배포ID appgdep_6adca17c1ae081919d6158dd33928c76. build/dist긍정유리/최종tar78JS 일치 검사 통과.
- 최종 v244 archive-backed 공개 배포 성공. 기능커밋fd7f17d00cad938dc188d8380a017eac45af51c7, 배포ID appgdep_6adca3917ea08191bada0dc72564e6c6. 선택 그림 제외·전용 투명PNG alpha/실제페이지출력 회귀와 build/dist긍정유리/최종tar78JS 일치 통과.
- v243은 저장만 하고 배포하지 않음. 최종본에 전용 pokemonExport 버튼을 추가: 전체 페이지의 흰 바탕과 배경사진을 제외한 UI만 pokemon-masters-ui.png로 저장. 일반 페이지 내보내기 경로는 그대로. 실제 공통 paintArtworkScene + saveArtwork 및 전용 투명 PNG alpha를 각각 검사.
- 최종 보정: 대화창만 선택에서는 기존 선택 그림을 자동으로 가져오지 않고 media 빈값/바깥 alpha0로 추가한다. 배경이 필요한 경우 전용 입력으로 추가 가능. 실제 선택 그림이 있는 상태의 추가 회귀 포함.
- 첨부7025/7024/7023의 공통 UI를 code-native Canvas로 재현. public/pokemon-masters.js, kind:gameui/gamePreset:6(기존0–5보존), 720×1560 권장 세로. 새 게임 대분류→포켓몬 마스터즈 EX, 전체 대화 화면/대화창만2종. 새 세로장 체크 기본ON, 해제시 현재장. 기존장 추가 한Undo·40레이어/100장·busy/비동기 문서변경 가드.
- 흰 둥근 창/청록 pill 이름표/주황 다음 표시, 하단 OFF·AUTO·넘기기 및 설정 gear. 709×1536/864×1536 참고의 창 y=1056/950·높이 비율 검사. 사진 없으면 UI바깥alpha0. 이름/대사·줄바꿈/글자크기/이름표색/위아래위치/요소별표시·버튼ON모양/배경사진 확대·x/y 편집. 원본 캐릭터/배경 이미지를 번들하지 않음. 하단 버튼은 내보낼 UI 모양이며 게임 재생 기능이 아님.
- media/postMediaImages 공통 로딩, loadPokemonAssets로 내보내기·비활성 썸네일 폰트/배경 대기. 고정gameui 공통 선택/레이어/복제/삭제·저장/로드·PNG 경로 유지. 경기천년제목M 공용 글꼴. 새 데이터 필드는 pokeShowName/Next/Buttons/Gear·pokeVoiceOn/AutoOn·pokeNameColor·pokeDialogueOffset 및 기존 gameText/Name/media/zoom/x/y.
- tests/pokemon-masters.cjs(읽기전용textarea타입 가드 포함): 실제 카탈로그·키보드/기존장·새장 추가/입력·체크·색상/배경업로드·비동기stale/JSON·native loader·PNG export·공통복제/레이어상한/5비율 Canvas 검사 통과. Native 출력3종 육안 확인. 기존game-dialogue-gradient/scroll-zoom/panel-boundaries·editor audit24/24 통과. 실제 브라우저·모바일 실터치는 미확인(기존Worker preview진입점없음).

## 모바일 컷 사진 확대 잠금 — 완료 / v241 공개 배포
- v241 archive-backed 공개 배포 성공. 기능커밋741bd393a63f437340787b3b1a0033bfbbb448b9, 배포ID appgdep_6adc8a0059d08191a249ac87e1a925df. build/dist긍정유리/최종tar77JS 일치 및 multi-move 회귀 검사 통과.
- 프레임 고정 바로 오른쪽에 모바일 전용 mobileScrollZoomToggle(사진 확대 ON/OFF). PC 상단 scrollZoomToggle과 studio.scrollZoom 공유, 기본ON·설정저장 실패시 세션 유지. 문서/Undo 변화 없음. 반응형 전환 시 두 버튼 표시상태 동기화.
- panel-photo-zoom.js: OFF는 모바일/PC 휠을 스크롤로 통과, zoomPanelPhoto도 이미 생성된 사진 제스처를 차단. mobile.js의 beginViewGesture에서 OFF면 사진 핀치 대신 캔버스 전체 확대/이동. 수동 사진 조절/캔버스 확대버튼·화면맞춤 유지, 프레임 고정 여부와 독립.
- tests/scroll-zoom.cjs: 실제 두 버튼/저장/라벨·Undo없음, 실제 mobile pinch 시작·이동 핸들러로 OFF=canvas2배+사진불변/ON=사진확대+viewport불변, 진행중잠금/모바일휠통과·PCmodifier 확인. panel-boundaries/panel-controls-photo-resize 회귀 통과. 실제 브라우저·모바일 실터치는 미확인.

## 가로 다크채팅 라이브 시간 — 기존 반영 확인 / v240 포함
- 2026-10-24 사용자 과거 건의 재확인. CHANGELOG의2026-10-12/v171(d6e70a2)에 이미 구현·배포된 기능. 현재 v240 배포archive와 최신source의 관련4JS 바이트 일치 확인.
- preset4 다크 긴 채팅/preset5 다크 묶음 채팅 모두 대사·스타일의 라이브 시간 입력과 하단 플레이어가 liveTime으로 연결됨. 고정형/이동형 공통, 기존 파일은00:24:18 fallback. 핑크미니/프로필카드도 지원.
- tests/asset-warp-live-time.cjs 재실행: 실제 입력핸들러로12:34:56변경/Canvas픽셀변화/JSON동일픽셀/Undo snapshot·busy·옛파일fallback 통과. 실제 모바일/브라우저 조작은 재검증하지 않음. 앱 코드 변경·새 배포는 불필요, 사용자에게 기존 기능 위치를 안내하면 됨.

## 컷 경계 조정 모드 — 완료 / v240 공개 배포
- v240 archive-backed 공개 배포 성공. 기능커밋4e97d9532b90aa571bf57b8b27db99ea15be4702, 배포ID appgdep_6adbe9d50fe08191a11fca0091d548e4. build/dist긍정유리/최종tar77JS 일치·editor audit24/24 통과.
- public/panel-boundaries.js. 이미지 탭의 컷 편집 영역 및 캔버스 아래 고정/편집 버튼 옆에 컷 경계 조정. session-only 모드이며 별도 문서 필드 없음. 민트 경계/↕↔손잡이를 드래그해 맞닿은 여러 컷을 동시에 늘이고 줄임.
- 기존 rect/4꼭짓점 polygon의 가까운 마주 보는 경계를 추론. T분기(상단2·중간1·하단2) 및 가로/세로 지원. 이동하는 각 경계선의 각도를 유지하고 인접 고정선과 교차시켜 꼭짓점 계산. 기존 틈 간격 유지. 외곽·숨김·독립·육각형·삽입컷/삽입컷의 부모는 제외.
- 최소40px단면/변 길이·볼록성·원래 winding·문서범위·신규겹침 검사, 초과 드래그는 유효 위치로 제한. 사진은 resizePanelPhotos 공통 시작좌표 기반으로 비율/확대·덮기 유지(숨긴사진 포함). 사진의 지우기/돌출·말풍선/다른이미지는 보존.
- 4화면px 문턱/한Undo, 포인터ID·busy/고정/페이지·객체교체 가드. Escape/포인터취소·캡처상실/blur/탭숨김/핀치에서 원래geometry 복원. 모드 중 개별 컷/사진/대사 드래그·더블탭 삽입·사진핀치/다중이동과 격리. 다른툴/개별컷모드/선택/페이지 변경은 모드 종료. 가이드는 편집 render에만 그려 PNG/썸네일에는 포함 안 함.
- tests/panel-boundaries.cjs: 첨부와같은 reference-bands의3변 연동, 가로·세로/마우스·터치 이벤트, 사선/간격/양쪽크기/사진비율·덮기/한Undo/취소·핀치·캡처상실/guard/JSON동일픽셀/실제app핸들러·타도구격리 검사 통과. 실제Canvas 전후 배치 육안 확인. 기존 panel-shape/controls-photo-resize/layout-lock/balloon-edit/empty-panel-upload/mini-edit-gesture/movement/template-resize 및 text-font-preference/rich-text/color-picker 검사 통과.
- 실제 브라우저·모바일 터치는 미확인(기존 Worker preview 진입점 없음). 이벤트 시뮬레이션·Canvas 출력 검증과 구분한다.

## 이순신체 실제 적용 — 사용자 재보고로 미해결
- 2026-10-24 사용자 화면에서 이순신체 대신 고딕체 미리보기. v239 OTS통과만으로 실제적용 성공을 단정할 수 없음. 직전 세션은 소스서버500으로 수정하지 못함. 이번 컷 작업에서는 소스연결 복구·최신 ebbb389 기반으로 진행하되 폰트 원인/해결은 아직 확인하지 않았음. 아래 v239는 당시 수행한 수정/배포 이력이며 사용자 실기기 해결완료를 뜻하지 않음.

## 이순신체 브라우저 로딩 실패 — 완료 / v239 공개 배포
- v239 archive-backed 공개 배포 성공. 소스e9ba518b380fff7d0d014bc9620c6ac346fec9a6, 배포ID appgdep_6adadd9d92548191bb8d5a7665c1365e. build/dist긍정유리·최종tar76JS/보정폰트2종OTS·원본/라이선스일치 검사 통과.
- v238 공식 원본TTF의 kern 하위 테이블 길이가65392인데 실제54902로 잘못 기록되어 있음. OpenType Sanitizer9.2.0으로 Regular/Bold 모두 `kern: Bad subtable 0 offset 8` 실패 재현. 기존 NAPI Canvas 검사는 이 오류를 허용하므로 브라우저 로딩 보장을 하지 못했음.
- 공식 원본은 보존. scripts/repair-yisunshin-web-fonts.py로 kern길이와 해당checksum/head.checkSumAdjustment만 수정한 -web.ttf2종 생성. 글리프/메트릭/cmap/커닝쌍/폰트명 불변, 기존폰트ID 유지. comic-fonts.js가 새파일경로를 사용해 이전 실패응답캐시와 분리.
- tests/yisunshin-web-fonts.py: 원본2종실패+보정본2종 OTS성공, 원본SHA256/보정재현성/허용바이트이외동일/모든윤곽·매핑·메트릭·커닝쌍 보존 검증. `OTS_SANITIZE=/path/to/ots-sanitize python tests/yisunshin-web-fonts.py`. 검사도구는 PyPI opentype-sanitizer9.2.0(저장소 의존성 추가없음).
- cover-fonts/compound-title 검사 통과. 공개URL은 실행환경403, Worker preview진입점 없음으로 실제브라우저·모바일은 미확인. 브라우저용 검증기 성공과 실기기 성공을 구분.

## 이순신체 / 엇갈린 표지 제목 — 완료 / v238 공개 배포
- v238 archive-backed 공개 배포 성공. 기능 커밋95465e7bd75f6cdb829c8eba6d32ebfb10b962ab, 배포ID appgdep_6adad9d667a88191bb50739e3cdb7b6f. build/dist긍정유리·최종tar76JS/원본폰트2종·라이선스 바이트일치·editor audit24/24 통과.
- 아산시 공식 이순신체 Regular/Bold 원본TTF 2종, 출처·라이선스 public/fonts/yisunshin/LICENSE.txt 동봉. 표지용 필터4종, 기존 폰트ID 유지. 유료 폰트 판매는 금지되며 매체 사용은 공식 안내에 허용됨.
- 표지 제목 총9종: 신규 이순신체 3종(엇갈린 금빛 달 / 백색 무협 서약 / 엇갈린 붉은 먹). public/compound-title-templates.js에서 크기·x/y가 서로 다른 native text3개를 기존 objectGroup으로 묶음. 새 문서 스키마 없음, 개별 text/art/저장·출력 유지.
- 문구3개/줄바꿈, R/B, 배치위치, 너비25–95%, 글자·그라데이션끝·외곽선색 편집 후 한Undo에 그룹 추가. 이후 문구는 더블클릭/더블탭, 개별 크기·위치는 그룹 해제 후 조정. 현재 선택에 스타일만 적용하는 기존 버튼은 배치/문구 보존.
- 실제 공식 폰트로3종 Canvas 출력 육안 확인. tests/compound-title-templates.cjs의 비균등크기·위치/한Undo/JSON동일픽셀/문구수정/320px맞춤/복제그룹ID독립/busy·빈문구·stale문서 가드 통과. cover-fonts/cover-title/color-picker/rich-text/text-font-preference/object-groups/multi-duplicate 검사 통과. 실제 브라우저·모바일 터치는 미확인.

## 색상 스포이드 / HEX / 최근 색 — 완료 / v237 공개 배포
- v237 archive-backed 공개 배포 성공. 커밋b3240f1f4615dbf4093aab6f23fe4a223c92f2f6, 배포ID appgdep_6adad7ed6ca4819198eab550dbe525b3. 최초 v236은 저장만 되었고 배포하지 않음. export.js 불일치 발견 후 전체 재빌드·새 소스커밋으로 저장. dist긍정유리/최종tar75JS 통과.
- public/color-picker.js: 모든 input[type=color] 옆에 캔버스 스포이드/HEX/최근12색. MutationObserver로 나중에 만들어지는 빠른 편집·게임/SNS/폰/조합 등 색상 입력도 자동 연결. 최근색은 studio.recentColors, 저장실패는 세션만 유지.
- 스포이드는 main canvas의 좌표를 원본해상도로 변환, export.js의 paintArtworkScene 공통 순서로1×1만 합성해 선택손잡이/가이드 제외 색 추출. 기존 input/change 핸들러로 적용하며 부분 글자선택 보존. pointer를 window capture에서 차단해 이동/핀치/바로편집이 실행되지 않음. 취소/Escape/범위밖/문서·선택·대상 교체/보안제약 시 색 변경 없음.
- 모달을 잠깐 닫아 canvas 탭 가능하게 하고 종료 후 복원, 모바일 패널도 복원. HEX는3/6자리 입력 정규화, 최근색은 중복제거/12개상한.
- tests/color-picker.cjs: 실제export합성 픽셀 대조/1px/배율좌표/포인터격리/범위보존/입력경로/취소·stale·CORS·모달/모바일복원/HEX·최근색·동적입력·disabled 검사 통과. rich-text/text-font-preference·editor audit24/24·build/dist긍정유리 통과. 실제 브라우저·모바일 터치는 미확인.

## 기본 경기천년제목 M / 마지막 글꼴 재사용 — 완료 / v235 공개 배포
- v235 archive-backed 공개 배포 성공. 기능 커밋586caf73663e31151c31fc21a55dd20117cbdbb1, 배포ID appgdep_6ada7bc786c08191bd3b94582102b5c6. 최종tar HTML·74JS 검사 통과.
- 기본 새 text/말풍선/나레이션/생각/외침 font를 comic_gyeonggi_title_medium으로 통일. public/text-font-preference.js, localStorage studio.lastTextFont. 기억한 글꼴이 없거나 현재 미등록이면 M fallback, 저장 불가 시 세션 유지.
- 일반/빠른 편집의 전체 글꼴 변경(rich setter), 글꼴미리보기, 사용자폰트 적용, 명시적 글꼴 프리셋/표지/워드아트/조합 적용 시 마지막 글꼴 기억. 부분범위 강조는 새 박스 기본을 바꾸지 않음. 기존 객체 선택·페이지 전환·프로젝트 열기로 기억값이나 기존 객체 폰트를 변경하지 않음.
- applyNextTemplate은 마지막 글꼴을 우선해 과거 active template이 수동선택을 덮지 않게 함. 첫5개 일반 상황 프리셋은 inheritFont:true로 마지막 글꼴 유지. 폰트명이 붙은 전용/사용자 프리셋은 직접 선택했을 때만 명시적 폰트 적용. 본문 sans/serif ID·게임UI·기존 저장 폰트는 그대로.
- tests/text-font-preference.cjs: 실제 native add/전체 rich setter/상황 프리셋, 기본7종/명시적 폰트·사용자폰트·새세션/미등록·잘못된 저장값·저장실패 fallback, active preset 충돌/기존 객체·부분강조 보존 통과. rich-text/cover-fonts/cover-title/font-persistence·editor audit24/24·build/dist긍정유리 검사 통과. 실제 브라우저·모바일 UI는 미확인(Worker preview entrypoint 없음).

## 대사 부분 서식 / 혼합 폰트 — 완료 / v234 공개 배포
- v234 archive-backed 공개 배포 성공. 기능 커밋14b6d03bb66d14acc8b093521fd695758e9e0831, 배포ID appgdep_6ada7101318c81918e887472f7068efa. build/dist긍정유리/최종tar HTML·73JS 일치 검사 통과.
- 기존 text 문자열 유지, items[].textRuns 선택배열 {start,end,font?,color?,fontSize?,weight?,slant?}. UTF-16 반열림범위, 정렬·비중첩·grapheme 경계·값 검증. 없으면 기존 렌더 그대로.
- public/rich-text.js: 일반/빠른 textarea 선택영역 기억→글꼴/색/크기/굵기/기울임 부분적용. 글꼴미리보기/사용자폰트 업로드/Ctrl+B,I도 선택영역 적용. 범위 없으면 해당 속성 전체적용하며 같은 속성 override만 지움. 전체적용/부분서식초기화 버튼, 선택영역 안내. 캔버스 클릭/객체·문서·Undo 객체 교체 시 오래된 영역 무효화.
- 입력·삭제·치환·한글IME 변경에 따라 범위 이동·잘림·삽입상속, grapheme 정규화로 이모지·결합문자 분할 방지. DOM innerHTML 서식 저장 없이 plain text+JSON만 사용.
- 가로 혼합폭 줄바꿈/가변 행높이·정렬, 세로 양방향 열배치/시작높이, 공통 paintGlyph의 외곽선/회전/흔들림 유지. 부분색은 전체 그라데이션보다 우선. drawBalloon 공통 경로로 화면·출력·워프·PNG대사 연결.
- 공용폰트 run별 지연로드/출력대기/비활성 썸네일 사전로드, 워프 캐시 font status, 사용자폰트 recursive embedding 유지. Clipboard는 run에서만 쓰는 폰트도 동봉. 조합형에셋 textRuns 복사/검증/폰트동봉 보존. 문구 없는 스타일 프리셋에는 textRuns 제외.
- tests/rich-text.cjs: 실제 inspector/mini input/글꼴modal/단축키 핸들러, 한Undo snapshot, 부분/전체·분할/병합·타이핑/IME/emoji·결합문자, stale selection, 가로/세로 양방향 실제 Canvas·JSON픽셀동일/공용로드/사용자폰트참조 검사 통과. mini-edit-gesture/reference56·asset-composer·cover-fonts/cover-title·editor-clipboard·editor-input-performance·editor audit24/24 통과. 가로/세로 혼합폰트 출력 비교 육안 확인.
- character-profile/asset-composer VM fixture에 필요한 ensureComicFont/validateMangaSfx/allAvailableCustomFonts 대역 누락 보완. 실제 관련 동작 검사 유지. build/dist긍정유리 및 최종tar 검사는 배포 로그 참고. Worker preview entrypoint 없어 실제 브라우저·모바일 터치 미확인.

## 표지 제목 템플릿 — 완료 / v233 공개 배포
- v233 archive-backed 공개 배포 성공. 기능 커밋c743ec12de81e0531ef027ae7aab41dfc6fbe7c7, 배포ID appgdep_6ada6e00c87c8191b0e6550648d131ce. 최종tar HTML/72JS 검사 통과.
- 대사·스타일 → 표지 제목 템플릿. HS봄바람체2.0: 왕실 금박/장밋빛 서약/백은의 밤. Cafe24 클래식타입: 크림 클래식/청록빛 이야기/잉크 모노톤. 폰트별3종, 총6종.
- public/cover-title-templates.js: 실제 폰트+공통 paintGlyph로 밝음/어두움 배경 미리보기. 폰트별 필터, 제목 추가/선택 text 스타일 적용을 분리. 추가는 native add 한Undo, 캔버스 너비에 맞춘 크기/하단 배치. 스타일 적용은 문구·위치·크기 보존. 새 데이터 필드 없이 native text/art로 저장.
- 지연 폰트 로드 실패/busy/선택·문서변경 가드, 각 스타일 독립 art 복제. syncLettering에서 적용버튼 상태 동기화, initLettering의 폰트등록 뒤 초기화.
- tests/cover-title-templates.cjs:6종 실제폰트/paint 미리보기, native 추가/한Undo, JSON동일픽셀, 스타일만적용/문구·geometry 보존, 필터/320px/busy/비text/비동기로딩 중 문서전환 검사 통과. cover-fonts/font-persistence/build/dist긍정유리 및 editor audit24/24 통과. 실제 Canvas6종 비교 이미지를 육안 확인. Worker preview entrypoint 없음으로 실제 브라우저/모바일 UI 미확인.

## 표지용 폰트 — 완료 / v232 공개 배포
- 사용자 블로그의6종 검토. HS봄바람체2.0(공식TTF)/카페24 클래식타입v1.1(공식WOFF2)을 공용 등록, 공식 라이선스 동봉. 빛의계승자/유료2종/Nymphette는 재배포 허용 근거 부족 또는 명시적 제한으로 번들 제외. docs/fonts/cover-font-review.md 참고.
- 글꼴 미리보기 전체/표지용/공용/불러온 폰트 필터+검색, 기본 선택창 표지용 그룹. 기존 폰트ID·저장·지연 로딩 경로 유지.
- v232 archive-backed 공개 배포 성공. 기능 커밋02acfc61e43cbf81bed5407ff9d9c4f4d097e50b, 배포ID appgdep_6ada684b0d5c8191953a333644c5f9e7. 최종tar entry 검사 통과.
- tests/cover-fonts.cjs 및 font-persistence 실제 Canvas/폰트 검사, build.mjs 배포entry, dist 긍정유리 검사 통과. Worker preview entrypoint 없음으로 실제 브라우저/모바일 미확인.

## 연결 선택지 / 단계별 Ctrl+G — 완료 / v231 공개 배포
- 연결 버튼 위 왼쪽/오른쪽에 말풍선 연결(민트)/이동 그룹화(금색) 두 버튼을 띄운다. 가능한 동작만 활성, 불가능/완료는 회색. PC/mobile 각각 실제 누른 버튼에 고정 위치를 계산하며 화면 가장자리8px 보장. 실행/바깥 클릭/Escape/재클릭/스크롤/리사이즈/선택·문서 전환 시 닫는다.
- Ctrl/Cmd+G: 연결 가능한 순수 말풍선은 먼저 balloonGroup 연결, 이미 연결된 상태에서 다시 누르면 objectGroup 그룹화. 혼합은 바로 이동 그룹화. 이미 두 동작이 완료되면 추가 Undo 없음. Ctrl/Cmd+Shift+G는 이동그룹만 해제하고 연결을 보존한다.
- 연결 구성 중 하나만 선택해도 표시된 연결 구성 전체를 이동 그룹화한다. 연결/이동그룹은 별도이며 명시적 말풍선 연결은 혼합 선택을 그룹화로 우회하지 않는다. 기존 저장 포맷/렌더 보존.
- public/connection-actions.js 신규, balloon-groups/app/mobile/renewal/index/renewal.css 변경. renewal 애니메이션은 부모 버튼 onclick을 덮어쓰지 않고 실제 연결 함수를 감싼다.
- tests/connection-actions.cjs: 실제 선택지·독립 동작·색상 규칙·활성/비활성·메뉴만 열 때 무변경·동작별Undo·Ctrl+G 순서·연결 멤버·stale/busy·키보드/닫기·320px 위치 검사 통과. object-groups/balloon-connection-routing/multi-move/renewal/multi-duplicate/multi-delete/editor-clipboard/autosave-scheduling/editor-input-performance, 빌드/dist 긍정유리 통과.
- editor audit24/24 및 git diff --check 통과. 최종tar HTML/71JS/유리3PNG 검사 통과. v231 archive-backed 저장·공개 배포 성공. 기능 커밋9c8cc9dc637658e56e4cb640edb3cf22626c12bd, 배포ID appgdep_6ada31114dac8191b7e89a163bb3c1dc.
- 실제 브라우저/모바일의 시각 배치·터치 확인은 미실시. Worker에 preview entrypoint가 없어 VM/Canvas 자동검사와 실제 UI 검증을 구분한다.

## 말풍선 연결이 그룹화로 바뀌는 문제 — 완료 / v230 공개 배포
- 원인: v225/e4266e2에서 selectionUsesObjectGroup의 tail===false/objectGroup 조건을 추가해, 꼬리를 끈 일반 말풍선과 기본 꼬리 없는 외침·나레이션·떨림까지 그룹화로 오분류했다. 연결 렌더 자체는 삭제되지 않았다. 수정 전 새 회귀 테스트에서 재현했다.
- 전부 connectable인 선택은 꼬리·기존 이동그룹과 무관하게 기존 balloonGroup 연결. text/asset/status 포함 혼합은 기존 objectGroup 그룹화. tail 표시값을 객체 종류 판별로 사용하지 않는다.
- 기존 이동 그룹은 연결해도 보존. 순수 말풍선에 연결+이동그룹이 공존하면 해제 버튼은 연결만 해제하고 이동그룹을 유지한다. Ctrl/Cmd+Shift+G는 별도 ungroupChosenObjects로 이동그룹만 해제하며 연결을 보존한다. 저장 포맷/ID/geometry 변경·자동 데이터 마이그레이션 없음.
- 모바일 UI와 renewal의 PC 하단 버튼 덮어쓰기도 동일 규칙으로 정리. PC 혼합 선택의 그룹화 버튼 비활성화 문제도 수정.
- tests/balloon-connection-routing.cjs:15기본윤곽×꼬리ON/OFF, 실제 버튼→Canvas 내부경계 제거, 기존 이동그룹, 해제/단축키 독립성, JSON/Undo, 혼합·busy 검사 통과. multi-move/renewal에서 실제 모바일 프록시와 PC 래퍼 버튼 라벨·활성 검사 추가.
- object-groups/balloon-opacity/dotted/multi-duplicate/multi-delete/editor-clipboard/autosave-scheduling/editor-input-performance 및 기존 editor audit24/24 통과. dotted의 오래된 VM 테스트에 누락된 validateMangaSfx 의존성 대역만 추가. 빌드/dist 긍정유리 통과.
- Worker preview entrypoint가 없어 실제 PC/모바일 UI는 미확인. v230 archive-backed 저장·공개 배포 성공. 기능 커밋d1b4d09929ad517ea44a8b2419e8bbbb2aeeb0e7, 배포ID appgdep_6ada2d39520c8191a869724452b1ebf5. 최종tar HTML/70JS/유리3PNG/반응54PNG 소스 일치 검사 통과.

## 대사 입력 부하 / 자동저장 — 완료 / v229 공개 배포
- 사용자가 승인한20초 idle/60초 최대 미저장 저장 시도와 레이어 부분 갱신을 구현. v229 native 공개 배포 성공. 기능 커밋11544c3b27be87a830f7a310ccc3226c57108b91, 배포ID appgdep_6ada2a6978ec81918604f633496fe726.
- layer-panel: type+ID별 행·버튼·썸네일 요소 재사용, 대사 입력은 해당 행만 갱신. 선택/순서/추가삭제/숨김/프레임숨김/Undo 객체교체에 맞춰 동기화. 장 카드도ID별 재사용. 이벤트는 최신 객체 참조로 연결.
- app/corner-fit/studio: 대사·빠른편집·워드아트 input 렌더를 rAF로 프레임당1회 병합. 데이터·레이어 이름은 즉시 갱신, 직접 render/출력은 동기 유지. 배경을 분리 캐시하는 작업과 Undo 전체JSON 복사 축소는 이번 범위에서 미구현.
- autosave: 마지막 수정20초/첫 미저장60초 중 빠른 시점. 드래그/포인터/한글조합/busy는500ms 뒤 재시도. 수동 재시도·전환·탭숨김의 조기 저장, 저장중 수정·revision/conflict·실패·동일ID재개 epoch 보호 유지. 연속 조작 중에는60초를 넘길 수 있으며 안전한 시점에 재시도한다.
- 장 썸네일: WeakSet dirty/WeakMap doc 상태, 변경 없는 flush/저장/선택은 기존 이미지 재사용. 변경 장만 저장·전환에서 생성하고 해당 카드 이미지 갱신. 런타임 캐시는 JSON 저장에 포함하지 않는다.
- tests/autosave-scheduling.cjs:20/60초·재설정·IME/포인터/각드래그·busy·blur·수동/탭숨김·저장중수정·실패충돌·revision·identity 검사 통과. tests/editor-input-performance.cjs: 실제 input/레이어/장카드 경로·rAF·부분갱신·재정렬·Undo참조·썸네일무효화 검사 통과.
- 동일 DOM 대역에서300레이어×100입력 비교: 이전af5f110 생성210,000노드, 변경 후0노드. 실제 브라우저 FPS나 사용자7800X3D/RTX5070 PC의 지연 개선 측정값이 아니다.
- 최종tar HTML/70JS/유리3PNG/반응54PNG 소스 일치 검사 통과. archive-backed v229 저장·공개 배포 성공.
- check-editor-audit24/24, frame-to-balloon edit/controls-photo-resize/multi-move/editor-clipboard 통과. npm build·dist 긍정유리 통과. Worker에 dev/static preview entrypoint가 없어 실제 브라우저/모바일 조작은 미확인.

## 히토미 켜라 해상도·누끼 검토 — 완료 / v228 공개 배포
- 54종 실제 prepareSticker 확대 시트와 원본을 대조. ID700–751의52종이 기본320px/목록424px보다 작은 원본이라4배 확대, 고해상도 복원2종752–753은 유지. 원본 PNG와9종-v2 보존, 동일ID에 새-hd-v3 URL.
- 51종은 원본 기반 Lanczos3+약한 선명화이며 없는 세부를 복구한 것이 아니다. 할짝742는 원본에서 빠진 상단 하트/ㅎ을 재분리(전체 구성을 담아 캔버스198:229), 화아아아714는 실제 겹친 마지막 글자와 복원조각의 직선 절단을 Imagegen 단일 복원으로 보정했다.714는 원본 픽셀 복원이 아니며 곡선/광채 차이가 있다.
- 검정원본8종의 분리된 작은 잔여물 제거, whitePaper 런타임 유지. 저장객체 x/y/w/h/회전은 수정하지 않는다. 일부 원본 흐림과 응 상단 겹침/종이 불규칙 경계는 남아 있어 전체 누끼 완전복원으로 설명하지 않는다.
- 근거·방법·한계: docs/assets/pink-reactions/review/README.md, decisions.json, before/after3시트, baseline-catalog.json. 재현 scripts/upscale-pink-reactions.cjs / review-pink-reactions.cjs.
- HD52/기존54 native 로드·추가·Undo·JSON·렌더·비틀기/원본9종 픽셀회귀/흰바탕/불투명도/커스텀에셋 검사 통과. build.mjs 및 dist 긍정유리 통과. npm이 없어 동일 node build 스크립트 직접 실행.
- 별도 asset-warp-live-time의 시간 픽셀 검사는 Windows 글꼴 미등록으로 최초 실패했으나 Arial/sans 글꼴 등록 재검사로 라이브시간/실제비틀기 전체 통과. 이번 에셋 비틀기는 HD 검사에서 통과. 브라우저 열기 시간초과, 실제 PC/모바일 UI 미확인.
- v228 native 공개 배포 성공(2026-10-21 11:54 KST), 기능 커밋a5960ca74d07def79abd02a18a450017c077be35. 로컬 최종tar의HTML/70JS/유리3PNG/반응54PNG 일치 검사 통과.144MB archive 업로드가300초 timeout으로 실패하여 서버 source build로 전환, 같은 정확한 커밋을 v228로 저장·배포 성공. 공개54PNG HTTP200/바이트일치, 카탈로그는 서버LF/WindowsCRLF 정규화 후 일치. 배포ID appgdep_6ad82914d14c8191b63b4c564fcb405f.
## 객체 Ctrl+C / Ctrl+V — 완료 / v227 공개 배포
- v227 native 공개 배포 성공(2026-10-21 09:49 KST), 기능 커밋153fe32. live references.js/balloon-groups.js HTTP200 및 SHA 일치. 클립보드/그룹/다중동작/컷삭제·24종회귀/빌드/dist 긍정유리/최종tar 통과.
- `references.js` 기존 단일 paste 경로를 확장. native copy 이벤트에서 선택한 표시 items를 deep snapshot, custom MIME `application/x-balloon-studio-selection`와 text/plain에 UUID token만 기록. 현재 editor session 버퍼와 실제 clipboard token 일치 때만 객체복제. clipboard read API/권한요청 없음.
- 이미지 file/items가 있으면 text/token보다 우선하여 기존 SNS사진/컷사진/선택이미지/새장 import 경로 그대로 사용. 파일을 읽을 수 없는 이미지item도 객체로 fallback하지 않음. 외부텍스트·빈clipboard·알수없는token에서 오래된 복사본 자동붙이기 금지.
- 입력칸/contenteditable/모달은 native 복사붙여넣기, 브라우저 선택문자 복사도 보존. busy에서 붙여넣기 mutation 없음. 초기화 한 번만 listener 등록.
- 복사본은 같은 탭/편집 세션 버퍼이며 새로고침/다른 탭으로 이관하는 파일포맷이 아님. 같은 세션 장 이동 후 붙여넣기는 사용폰트 데이터까지 한Undo로 합류. copy는 무변경, paste는 공통 duplicateChosenBalloons(source,active,offset,fonts)로 새ID/그룹ID/상태 하위ID와 독립설정 유지, 매번25px 누적offset/복제본 선택. 500개 상한은 사전 가드.
- `tests/editor-clipboard.cjs`: 실제 copy/paste 등록핸들러+공통복제, frozen snapshot/선택변경/반복offset/한Undo/폰트/상태ID, 외부이미지4개분기+filesfallback+token동시존재 우선, 외부텍스트/빈값/읽기불가imageitem에서 stale buffer fallback 금지, 입력/모달/선택문자/busy/전용MIME실패 시 text fallback/같은세션 장 이동. 다중이동/복제/그룹/삭제 회귀 통과.
- 실제 브라우저 OS clipboard/PC 단축키 조작은 미확인. 현재 Worker hosting에 dev/static preview entrypoint 없음.

## 다중 선택 일괄 삭제 — 완료 / v226 공개 배포
- v226 native 공개 배포 성공(2026-10-20 21:54 KST), 기능 커밋825d0c8. live app.js/balloon-groups.js HTTP200 및 SHA 일치. 빌드/dist 긍정유리/최종tar 및 삭제·그룹·이동·복제·상태·컷삭제 회귀 통과.
- 기존 삭제는 active 하나/그 active의 objectGroup만 삭제해서 임시 다중선택 또는 여러 그룹 혼합 선택을 놓쳤음. 공통 삭제에서 deleteChosenBalloons를 호출해 chosenBalloons 전체 ID와 그 objectGroup 합집합을 한checkpoint에 삭제.
- PC 버튼/Delete/Backspace·모바일 버튼 모두 공통 경로. 선택·드래그 정리, 빈선택·busy는 무변경. 선택된 그룹의 숨긴멤버 포함 삭제는 유지, 미선택 시각연결멤버/사진/컷 보존. 프레임 편집의 컷 삭제 우선라우팅 유지.
- tests/multi-delete.cjs: 실제 버튼/모바일/키보드 실행, 그룹없이 복수선택/그룹+독립항목/숨김구분/미선택보존/한Undo snapshot 전체복원/선택초기화/반복·busy·입력·조합·모달·컷라우팅. object-groups/multi-move/panel-controls-photo-resize 회귀 통과. 실제 브라우저/모바일 미확인.

## 도형·에셋 그룹화 / Ctrl+G — 완료 / v225 공개 배포
- v225 native 공개 배포 성공(2026-10-20 21:36 KST). 기능 커밋e4266e2. live app.js/balloon-groups.js/mobile.js HTTP200 및 SHA 일치. 빌드/dist 긍정유리/최종tar/24종 회귀 통과.
- `balloon-groups.js`: 선택에 text/asset/statusUI/꼬리false 도형/기존objectGroup이 있으면 연결 버튼=그룹화, 그 외 기존 말풍선 시각연결 보존. 색·외곽·위치를 합치지 않고 선택 objectGroup 문자열만 저장. 일반 말풍선도 Ctrl/Cmd+G로 그룹화 가능, Ctrl/Cmd+Shift+G/해제 버튼으로 해제.
- 그룹은 멤버 하나를 선택하면 표시멤버 전체 선택, Shift/모바일 다중 토글은 그룹단위. PC/모바일 일반 선택 모드에서 하나를 잡아 즉시 함께 이동. 기존 모바일 임시 다중+선택이동도 유지. 방향키/삭제 그룹단위. 복제는 새그룹ID로 분리. 스타일프리셋에 그룹ID 제외, JSON validation 선택필드 확인, Undo/저장/페이지복원 그대로 유지.
- 숨긴 그룹멤버는 이동선택에 제외, 그룹 해제/전체그룹 삭제는 숨긴멤버에도 적용. 원래 balloonGroup 시각연결은 objectGroup과 별도이며 그룹해제 시 기존 시각연결은 보존.
- `tests/object-groups.cjs`: 실제 연결/해제/공통복제/키보드핸들러, styles/JSON/재선택/Shift/병합/독립복제/방향키/삭제/한Undo/입력·모달·조합·반복·busy가드/기존시각연결. `multi-move` 실제 모바일그룹화버튼→일반모드이동/PC다른선택후그룹잡기 추가. `renewal` obsolete dist 경로→public 및 서버라우트 예외로 갱신, 애니메이션/출력안전 검사 통과.24/24 종합회귀 및 다중이동/복제·빠른편집/프레임삭제 검사 통과.
- 실제 PC/모바일 브라우저 조작은 미확인(Worker preview entrypoint 없음). 기존 pickedBalloons/items 범위이며 독립 imageLayers/컷의 혼합선택은 구현하지 않음.

## 검정 말풍선8종 흰 바탕 — 완료 / v224 공개 배포
- v224 native 공개 배포 성공(2026-10-20 21:17 KST), 기능 커밋273d571. live sticker-assets.js/sticker-data.js HTTP200 및 SHA 일치. 빌드/dist 긍정유리/최종tar 및 원본54종/정밀분리/흰바탕/불투명도/비틀기 검사 통과.
- 히토미 켜라 ID704–711의 검정 바탕만 흰색으로 표시. PNG를 다시 그리거나 교체하지 않고 기존 prepareSticker 로더의 whitePaper 팔레트 변환 사용. 검정 성분 제거+채널차 유지로 문자 검은halo를 제거, alpha/외곽/원본크기 보존. 카탈로그 이름 흰 말풍선, paperOpacity 사용.
- 원본PNG/ID/기존문서geometry 보존. 기존 작업도 같은ID를 로드하면 흰바탕 적용, 다른46종은 원래 로딩 경로. weakset으로 중복변환 방지.
- tests/white-reaction-paper.cjs:8ID·정확alpha·검정→흰색·잉크채널차(반투명 픽셀 반올림 허용)·중복변환·바탕불투명도·다른46종 무변경. Native Canvas8종 확대 시트 육안 확인. 실제 브라우저/모바일 미확인.

## 다중 선택 함께 이동·복제 — 완료 / v223 공개 배포
- v223 native 공개 배포 성공(2026-10-20 21:06 KST). 기능 커밋d8b2e24. live mobile.js/balloon-groups.js/app.js HTTP200 및 SHA 일치. 빌드/dist 긍정유리/최종tar 및24/24종합회귀 통과.
- `public/mobile.js` viewport capture에서 선택된 items(말풍선/텍스트/효과음/상태창) 묶음 이동. 모바일 다중과 이동을 함께 ON 가능, 다중일 때 이동 버튼 문구 `선택 이동`. 선택한 본체 드래그는 함께 이동, 빈 곳은 기존 화면pan. 선택 이동OFF면 기존 탭 선택/해제.
- PC는 2개 이상 선택했을 때 선택 본체 드래그로 바로 이동. 별도모드 불필요, Shift+클릭은 선택 토글 유지. 단일 선택의 크기/회전 핸들 및 기존 편집 경로 유지.
- 4 CSS px 문턱 후 한Undo, 모든 항목 공통delta·경계제한으로 간격 유지, 시작좌표 기반으로 왕복누적 없음. 숨긴 항목 제외/선택 유지. pinch 시작·pointercancel·blur·문서교체에서는 이전문서 재수정 없이 취소.
- `tests/multi-move.cjs` 전체 mobile 스크립트+실제 선택 모듈/viewport handlers 검사: 모바일 버튼공존, 터치/마우스/PC직접이동, 간격/경계/문턱/한Undo/JSON좌표·스타일보존, 숨김, 취소·핀치복원, 빈곳pan, 모드/Shift/busy/단일선택. mini-edit-gesture/panel-balloon-edit/panel-controls-photo-resize/manga-sfx 회귀 통과. 실제 PC/모바일 브라우저 조작은 미확인(Worker preview entrypoint 없음).
- 공통 복제 버튼도 `duplicateChosenBalloons`로 선택된 표시항목 전체를 복제. deep clone/모두25px같은offset/한Undo/순서유지, 복제세트를 재선택해서 바로 이동. 복제된 연결그룹 새ID, 단독 멤버는 그룹에서분리, 상태 하위ID 재발급. 이미지 단일복제 경로는 기존 유지.
- `tests/multi-duplicate.cjs`: 실제 공통버튼·선택세트·숨김제외·원본독립·그룹재매핑·반복복제·상태ID/선택행·한Undo·busy/empty/JSON. `multi-move`는 실제 모바일 복제버튼→복제본 묶음이동도 확인.24/24 종합회귀 재확인.
- 범위는 기존 pickedBalloons 기반 items 다중 선택. 독립 이미지/사진/컷의 다중 선택 추가는 이번 변경에 포함하지 않음.

## PC 스크롤 줌 잠금 — 완료 / v222 공개 배포
- v222 native 공개 배포 성공(2026-10-20 18:56 KST). 기능 커밋5ce293d. 빌드/dist 긍정유리/최종tar 통과, live HTML/휠모듈/CSS HTTP200 및 SHA 일치.
- 가로/세로 버튼 바로 옆 `스크롤 줌 ON/OFF`, PC(너비800px 초과)에만 표시. 기본ON, 브라우저별 localStorage `studio.scrollZoom`으로 유지(저장 불가 시 세션만).
- 실제 휠 경로는 컷 안 사진 확대. OFF일 때 이벤트 취소/사진 변경/Undo 없이 기본 스크롤로 통과. 모바일 핀치/기존휠, +/-/화면맞춤은 변경하지 않음.
- `tests/scroll-zoom.cjs`: 실제 휠 경로 ON/OFF 사진 크기/Undo/스크롤 통과/설정복원/저장실패/모바일/수정키 검사. 프레임 잠금/삭제·리사이즈 회귀도 통과. 현재 Worker preview entrypoint가 없어 브라우저·실제 PC 휠 확인은 미실시.

## 현재 기준
- 사이트: https://balloon-studio.fit-charm-3959.chatgpt.site
- project_id: `appgprj_6aae4d5fae0c819196c7f66aef61c675`
- 최신 확인한 공개 버전: v227. Sites native 배포 성공 확인(2026-10-20 Asia/Seoul).
- 기능 배포 커밋: `a5960ca74d07def79abd02a18a450017c077be35`. 배포 후 문서만 갱신한 커밋은 Git 최신 이력에서 확인한다.
- 작업 시작 소스: `61b3604c70035fdb2e290b7f9163f0bada31ee17`.
- 직전 작업: X가 Bonded보다 위에 있어 사용자 지시대로 X 좌표는 고정, Bonded/밑줄/하트만16px 위로 이동. 실제 Canvas alpha 가중 중심으로 X와 Bonded 세로 정렬 검사(3px 이내) 통과. 하트는 d 끝획에서 아래 꼭짓점으로 진입→오른쪽으로 상승→왼쪽으로 돌아 하강→꼭짓점을 지나 흘리는 끝획으로 재작성.
- 직전 작업: 사용자 최종 선택으로 Bonded/밑줄/연결 하트의 잉크를 과거 Provided 당시 `rgba(194,36,49,0.72)`로 복원. 전용 NIKKE_BONDED_INK 상수 사용, RANK 색상은 유지. Dynalight/크기/기울기/연결 하트 모양은 변경 없음.
- 직전 작업: 사용자 제공 무료 폰트 비교 목록에서 Dynalight 선택. 원래 PNG Bonded 대신 실제 Dynalight로 Bonded를 렌더하고 빈 하트(♡)·밑줄2개를 조합. 현재36px, 원점(371,1354) (기존 좌표에 y=-16 공통 이동), -0.55rad, 전용 NIKKE_BONDED_INK 색상(위 참조), 추가 globalAlpha 감소 없음. 사용자 추가 지시로 하트도 필기체 연결을 확인. Dynalight cmap에 U+2661/U+2665/U+2764와 heart 이름 글리프가 없고 실제 Bonded♡ 렌더에서도 하트 누락 확인. 마지막 d 끝획에서 이어지는 하트를 같은 회전좌표계에 직접 그림.
- 폰트는 Google Fonts 공식 저장소 `ofl/dynalight`의 원본 TTF. 저작권 Brian J. Bonislawsky DBA Astigmatic, SIL OFL1.1 원문 함께 배포. `public/fonts/dynalight/`에 보관, `lettering.js` builtinFontReady에 Studio Dynalight 추가. 사용자 이미지 출처 https://m.blog.naver.com/designer_hyeon/221349589091 (도구로 본문 직접 열기는 실패, 첨부 이미지를 비교 기준으로 사용).
- `ensureNikkeBonded()`는 이제 builtinFontReady를 기다린다. 기존 PNG는 과거 참고 자료로만 남고 렌더에는 사용하지 않음. 화면/저장 복원/출력/썸네일의 사전 로드 연결 유지. 작업 기록 `docs/assets/nikke-bonded.md`.
- `nikkeBondedMode` auto/show/hide, 자동은 상담 일지 현재 값>=5. Bonded 숨김 시 X/덧쓰기도 숨김. 기존 데이터·밑줄2개·기울기 유지. 현재 Bonded/밑줄/하트는 사용자가 최종 승인한 과거 잉크로 통합, RANK 강조색과 분리. 토글/문구는 checkpoint 경로.
- `nikke-bonded-asset`을 실제 Dynalight 등록/라이선스 포함/자동4·5경계·수동표시·제목/횟수 보존·JSON/상세UI/Undo 검사로 갱신해 통과. `nikke-scribble`, `nikke-details` 통과. 실제 폰트 렌더로 Bonded♡ 배치 확인. 실제 브라우저·모바일 미확인. v193 Bonded 상향·하트 필순 보정 공개 배포 성공.

## 히토미 켜라 누끼 정밀 재작업 — 완료 / v221 공개 배포
- v220의 성긴 분리 경계가 글자/말풍선 본체까지 잘라냄. 사용자8개 캡처로 재작업 요청. 재생성보다 정밀 자르기라는 후속 지시 반영, AI 재생성본은 적용하지 않음.
- 원본 source-6842.png 직접 사용, opaque RGB 보존/반투명 가장자리 배경 분리/원본 획 성분과 세부 마스크. 꿀렁/할짝/응/츄읍/팡/뷰르르릇/움찔/화아아아8종과 머엉까지9종 -v2.png. ID/사용자 geometry 유지, URL 갱신. 원본에서도 겹친2곳만 같은 시트의 온전한 뷰/아/ㅏ 픽셀 재사용. 상세 docs/assets/pink-reactions/README.md와 precision-extraction.json.
- tests/pink-reactions-repair.cjs: 투명16px 여백/ID·URL/해상도와 실제 잘린 원본 획7좌표 RGBA 일치. pink-reactions의54개 네이티브 load/add/Undo/JSON/렌더·필터·키보드 검사 통과. 원본 확대 및 어두운 배경 확대시안 대조, 생성본 미사용. 빌드/dist 긍정유리/최종tar 통과, v221 native 공개 배포 성공. 공개카탈로그+교체9PNG HTTP200/SHA256 일치. 실제 모바일/브라우저 미확인.

## 히토미 켜라 에셋 — 완료 / v220 공개 배포
- 사용자6842 시트의 문구/말풍선/장식을54개 개별 투명 PNG로 추가. 기존구성52개와 사용자 지정 츄루루룹♡/부들 생성복원2개. Imagegen 배경제거 시트를 분리하고 연결 하트/흰·검정 종이 유지. 복원본은 원본 픽셀 복원이 아니며 목록에 복원 표기.
- 고정 에셋에 사용자 지정 이름 히토미 켜라 탭 추가. reactions 컬렉션, ID700–753, 기존ID/오곡전도사 목록 보존. 탭 선택/aria/방향키5개 순환 갱신. nativefixed 에셋 경로로 크기/회전/색상/비틀기/가시성/저장/출력 지원.
- docs/assets/pink-reactions/catalog.json의54종 목록/크기/파일 대응. public/sticker-assets/pink-reactions에 개별PNG. tests/pink-reactions.cjs로54개 alpha/크기/중복ID/실제load·add·checkpoint·JSON·PNG렌더/필터분리/키보드 탭 검사 통과. tests/custom-assets.cjs의 옛dist경로를public으로 정리해 현재소스를 검증. 기존24/24 종합회귀/만화효과음 통과. PNG접촉시트 육안확인. 빌드/dist 긍정유리/최종tar 통과, v220 native 공개 배포 성공. 공개HTML/연결4스크립트/54PNG 총59파일 HTTP200 및 SHA256 일치 확인. 브라우저/실기기 미확인.

## 만화 위압 효과음 — 완료 / v219 공개 배포
- 에셋 기본 목록 맨 위에 ゴ/ド × 낱개/4개묶음 × 검정/흰입체/보라빗금/파랑그라데이션16종. 원본 기하로 직접 그려 폰트·업로드 그림·외부 요청 없이 투명 합성.
- text.mangaSfx 선택 설정. 전용 편집기로 글자/스타일/반복1~8/간격/점감/곡선/3색 조절. native 이동·크기·회전·삭제·레이어·프로젝트 저장/썸네일/PNG 공통 렌더 유지. 일반 대사 빠른편집에서 제외. 설정 불변교체로 복제본 독립, 입력 한Undo.
- tests/manga-sfx.cjs:16카드/실제add/실제control입력·Undo·복제독립/JSON검증/8투명렌더 결정성·hidden 검사 통과. 실제 Canvas 비교 시트 육안 확인.24/24 기존 종합회귀 통과. 빌드·dist 긍정유리·최종tar 통과. v219 native 공개 배포 성공, HTML/새모듈/연결3파일 live HTTP200 및 SHA 일치. 현재 Worker에 preview entrypoint가 없어 브라우저/실기기 미확인.

## 프레임 삭제·편집 토글·내부 사진 크기 연동 — 완료 / v218 공개 배포
- 편집모드에서 선택 프레임이 있으면 공통/모바일 삭제를 컷 삭제로 활성화. 키보드 Delete/Backspace도 같은 deleteCurrentPanel 경로. 프레임만 지우고 연결사진은 일반 이미지로 남김, 삽입컷 연결 정리/한Undo. 잠금/busy/모드OFF에서는 공통 컷 삭제 차단, 복제 버튼은 프레임 선택으로 활성화하지 않음.
- 프레임 고정 옆에 편집 모드 ON/OFF. ON은 현재/첫 표시 프레임 선택·다른 객체선택 해제, OFF는 현재 프레임을 기억하면서 드래그/꼭짓점편집 종료. 고정 중 비활성화, 영구데이터/Undo에 편집모드는 저장하지 않음.
- 드래그 시작 시 연결사진 x/y/w/h snapshot. 사각/사선/육각 프레임 resize와 꼭짓점 변경마다 시작 geometry에서 cover배율·크롭 위치를 재계산. resizePanelPhoto를 캔버스리사이즈와 공유해 비율/원본기준 확대정도 유지. 숨긴사진도 연동, 획/돌출/다른사진 보존. 한드래그 한Undo, 왕복/반복 위치 누적 없음.
- tests/panel-controls-photo-resize.cjs에서 실제 app buttons/delete/keyboard와 mobile sync/delete 전달, 실제 패널 init/handlers로 토글/삭제/Undo·lock·busy, mouse/touch3도형 확대·축소·역방향/꼭짓점·사진비율/zoom·JSON 검증. panel-movement의 과거 사진미변경 기대를 새 비율보존 동작으로 갱신. panel-template-resize/panel-balloon-edit/panel-layout-lock/panel-shape/empty-panel-upload와24/24 종합회귀 통과. 빌드·dist 긍정유리회귀·최종tar 검사 통과. v218 native 공개 배포 성공. 실제 브라우저/휴대폰 미확인.

## 프레임 선택 후 말풍선 빠른 편집 — 완료 / v217 공개 배포
- 재현: 컷 선택으로 panelEditMode가 켜진 뒤 말풍선 내부를 눌러도 beginPanelPointer가 먼저 프레임 body로 소비하고 miniObjectAtEvent도 모드 전체를 거부함. 실제 app.onpointerdown+panels+corner-fit 통합 검사에서 첫 탭 선택이null로 남는 실패 재현.
- 실제 프레임 모서리/꼭짓점 핸들은 우선 유지, 그 외 말풍선 hit는 exitPanelEditing으로 프레임모드/drag/선택을 종료하고 native 말풍선 선택 경로에 전달. pickBalloon을 쓰는 레이어목록/다중선택도 동일 종료. mini capture는 말풍선을 먼저 식별하고 프레임편집 뒤 이미지빠른편집 차단은 유지.
- tests/panel-balloon-edit.cjs에서 실제 app pointer dispatch와 두 모듈을 함께 실행: mouse/touch/pen 단일선택(미편집)→두번편집→실제 대사입력, 프레임geometry 불변/목록선택/프레임body·handle/busy·pan 제외 검사 통과. mini-edit-gesture의56종 및 panel-movement/panel-shape/panel-layout-lock,24/24 종합 선별 회귀 통과. 빌드·dist 긍정유리 회귀·최종tar 검사 통과, v217 native 공개 배포 성공.
- 현재 Worker hosting은 scripts.dev/static.directory가 없어 sites-preview start가 실행불가. 브라우저/실제 휴대폰 검증은 미실시이며 VM 실제핸들러 검사와 구분.

## 컷 크기 입력 차단·프레임 리사이즈 수정 — 완료 / v216 공개 배포
- 재현: 세로형에서1600×900 입력,1200정사각,900×12000/4000×5000 모두 추가0개로 끝남. 방향 선택 불일치/정사각 배제 및 컷팝업의 옛8000px/1600만 제한이 원인. 입력change/적용 시 실제 너비/높이로 방향과 레이아웃 접두사 자동 동기화, 정사각 옵션, 문서 공통 최대16000×30000/4000만(컷용 최소320 유지) 적용. 오류를 팝업 안에도 표시하고 긴 캔버스 미리보기는180×260 안에 제한.
- 기존 resizeComicPage가 모든 프레임에 min(sx,sy)를 적용해 비율 변경 시 여백을 남겼음. 프레임은 x/w에sx,y/h에sy를 적용해 정규화 배치/꼭짓점/삽입컷 연결 보존. 연결사진은 원본 기준cover 배율 비례/크롭 위치로 갱신하고 constrainPanelPhoto로 빈틈 방지. 글자·일반 이미지·배경은 기존 균등 배율 유지. 고정 중에도 명시적 캔버스 크기 변경은 적용되며 잠금 상태 보존.
- 일반 크기입력/컷팝업 크기만 변경/사진원본에 맞추기 모두 공통축별 최소컷40px 검사와 공통resize 사용. 새 템플릿 적용·크기변경 각각 한 Undo.
- tests/panel-template-resize.cjs: 재현4경우와40MP경계/방향·정사각/미리보기한도/팝업오류/2~8컷전체/프레임정규화·삽입컷·사진cover·글자비율/잠금양쪽/Undo·JSON 검사. custom-canvas-size/panel-layout-lock/panel-movement/panel-shape/empty-panel-upload 및24/24 종합 선별 회귀 통과. 빌드·dist 긍정유리 회귀·최종tar 검사 통과. v216 native 공개 배포 성공. 실제 브라우저/휴대폰 미확인.

## 캔버스 아래 프레임 고정 — 완료 / v215 공개 배포
- 해상도 표시 위/캔버스 바로 아래에 프레임 고정 토글. 현재 장의 모든 만화 프레임을 보호하며 장별 panelLayoutLocked 선택 boolean(누락=false)로 저장. 고정됨·해제와 설명/aria-pressed 표시, 프레임 없는 장은 숨김.
- 고정 중 패널 pointer 시작·이동과 꼭짓점/삭제 컨트롤을 차단. 진행 중 panelDrag 해제, 편집모드/손잡이 종료. 목록·레이어 탭에서 다시 선택해도 고정을 우회하지 않음. 연결 사진 hit/확대/이동/교체 경로는 유지.
- 토글 한 번 Undo, multi-page/단일 구형 import·프로젝트 저장·자동저장·페이지 전환 복원. 새 빈 장/기존 누락 데이터는 해제 기본. 캔버스 크기 변경이나 새 레이아웃 적용 같은 명시적 배치는 기존 공통 경로 유지. PNG/썸네일에 편집용 고정버튼/힌트가 포함되지 않음.
- tests/panel-layout-lock.cjs: mouse/touch 이동/resize/vertex 차단·진행제스처 정리·disabled/직접 핸들러·사진 hit/zoom·Undo/JSON/다중 장/구형/잘못된값/busy/빈장·PNG 픽셀 불변 검사 통과. panel-movement/panel-shape/empty-panel-upload/custom-canvas-size 및24/24 종합 선별 회귀 통과. 빌드·dist 긍정유리 회귀·최종tar 검사 통과, v215 native 공개 배포 성공. 실제 브라우저/휴대폰 미확인.

## 캔버스 크기 설명문 간격 — 완료 / v214 공개 배포
- 사용자 스크린샷1792334582261.jpeg의 적용 버튼/설명 겹침: 공통 .hint의 margin-top:-8px가 원인. 이 영역에만12px 양수 위 간격과8px 아래 간격,12px/1.6 줄높이 적용. 버튼은 block 흐름, 한도 문구는11px muted와8px 위 간격. PC/모바일 공통, 다른 hint는 보존.
- CSS 캐스케이드·빌드·dist 긍정유리 회귀·최종tar 검사 통과. v214 native 공개 배포 성공. 브라우저/실제 휴대폰 화면은 미확인.

## 이미지 탭 최상단 캔버스 직접 설정 — 완료 / v213 공개 배포
- PC/모바일 공통 이미지 탭 맨 위, 프로젝트 이미지 목록보다 앞에 너비/높이(px)와 적용 버튼 추가. Enter도 적용. 현재 장만 변경하며 기존 prepareComicResize/resizeComicPage로 콘텐츠 비율/중앙 정렬 및 고정 프레임 화면 맞춤 유지.
- 너비40~16000/높이40~30000/전체4000만 픽셀 이하 정수, 컷 최소40px, busy/동일크기 보호. 적용 한 번 Undo, 입력 초안은 무관한 렌더에서 유지하고 장 전환/Undo/실제 크기 변경 시 갱신.
- custom-canvas-size에서 실제 공통 resize/배경 PNG, 텍스트 비율/고정 레이어/Undo/Enter/한도/작은컷/busy/탭 첫 배치 검사 통과. template-photo-sizes 회귀, 빌드·dist 긍정유리 회귀·최종tar 검사 통과. v213 native 공개 배포 성공. 실제 브라우저/휴대폰 미확인.

## 명일방주 텍스트만 템플릿 — 완료 / v212 공개 배포
- 명일방주 선택 목록 맨 앞에 텍스트만 · 투명 배경 추가. 기존 Day/Night와 별도 생성하며 arkTextOnly:true 선택 필드로 저장. 기본 밝은 글자, 기존1536×864 위치·기울기·16:9 맞춤 유지. 패널/아이콘/사진/게이지 선은 출력하지 않음.
- 기존 글자 렌더의 좌표·문구를 기록한 뒤 투명 캔버스에 텍스트만 합성. 기존 Day/Night는 동일 경로 그대로 유지. 생성 시 framePriority:above 및 이미지 목록 마지막에 추가. 이후 사용자가 레이어 순서를 조절할 수 있음.
- 대사 패널 맨 위에 열린 메뉴별 문구/표시 설정. 닥터/대사/재화/날짜/진행/소식 문구·표시 수정과 JSON/Undo/출력 공통 경로 유지. 텍스트 전용에는 사진 업로드·아이콘·경험치 컨트롤을 표시하지 않음.
- tests/arknights-ui.cjs에 실제 Canvas 패널/아이콘 미출력·텍스트 픽셀·JSON/편집/Undo/표시·생성 최상위 이미지 순서·첫 번째 선택 카드 검사 추가. DOM readonly guard 및 layer-visibility 통과. 빌드·dist 긍정 유리 회귀·최종 tar 검사 통과. v212 native 공개 배포 성공, 공개 HTML/arknights-ui.js의 HTTP 수신 SHA-256이 검증 빌드와 동일. 실제 브라우저/휴대폰은 미확인.

## 파손 유리 받침판 보강 — 완료 / v211 공개 배포
- 사용자6637.jpg 피드백: 움직인 유리 조각 틈으로 뒤 그림이 비쳐 판이 삭제된 듯 보임. 긍정 유리 렌더에 불투명 받침판→유리/글자 조각→금색 프레임 순서 추가. 파손 geometry/clip/명도/역방향/낙하는 그대로 유지.
- drawPixelPositiveBacking: 테마별 무광 어두운 판과 안쪽 모서리. 두 유리 영역 전체에 받침이 남고, 위 게이지와 하단 왕관 사이도 좁은 받침 목으로 연결. 상단 원본 금색 연결 테두리의 clip 범위를740→760으로 보강. 받침은 프레임 안쪽에만 있으며 주변 캔버스는 투명.
- tests/pixel-rpg-positive.cjs: 3색의100/35/0%에서 유리 아래 판 전체alpha255, 빨강/초록 배경에서 안쪽 합성 픽셀 일치, 외곽 캔버스 투명 검사. 유리 자체의 파손 틈alpha는 유지해 받침판과 파편이 별도 층임도 확인. 기존 수치/Undo/JSON/슬라이더/역방향/취소 검사 유지. pixel-rpg/positive 검사·구문·빌드·dist 렌더·최종 tar 검사 통과. v211 native 배포 성공, 공개 루트 HTML/관련 JS2개를 HTTP로 받아 검사 빌드와 SHA-256 동일 확인. 실제 브라우저/휴대폰 미확인.

## 긍정 유리 두 원본·연속 파손 — 완료 / v210 공개 배포
- 사용자 최신 결정으로5단계 그림 전환을 폐기. 각 색의 승인 PNG에서100%/일반 두 프레임만 무손실 패킹한 positive-{blue,pink,orange}-pair.png 사용(1024×420). scripts/pack-positive-glass.cjs로 재생성. 기존6상태 원본은 참고/복구용으로만 남고 런타임은 읽지 않음.
- 100%는 전용 광채,0~99%는 동일 일반 질감에 고정 크기 clip과 연속 명도·대비·채도 감소. 임계 구간의 그림 교체 없이 조절됨. Voronoi 고정11조각/공유 균열을 한 번 생성하고, 빛 감소→금 성장→조각 간격/회전→하단 조각 낙하 순서로 smoothstep 진행. 유리와 이름/숫자를 합친 원본을 같은 조각으로 잘라 함께 이동. 난수·시각 없음.
- 슬라이더를 되돌리면 캐시를 비운 뒤에도 같은 픽셀로 복원. PNG/썸네일/복원 공통 현재 진행도, 자동 재생 애니메이션/동영상 출력은 아님. 기존 테마/사용자 이름/연동·독립/파손 토글/legacy 필드 그대로 유지.
- 편집 패널에 실제 range 슬라이더 추가: 게이지 드래그 조절, 독립 입력 시 아래 가치 드래그 조절. input마다 live render, 한 드래그당 checkpoint1회, change에서 동기화, pointercancel 원래값 복원. 기존 캔버스 게이지 드래그/취소도 유지.
- tests/pixel-rpg-positive.cjs를 두 원본만 로드/모든 값의 파손 매개변수 단조성/조각 면적 합/캐시 비운 역방향 픽셀 일치/실제range 다중 input Undo1회·취소·busy·확정 검증으로 갱신. 기존 JSON/색상/프리셋/stale/투명/연동/캔버스 취소 유지.24/24 선별 회귀·구문·빌드·dist 렌더·최종 tar 검사 통과. v210 native 공개 배포 성공, 루트 HTML/JS2개/새 pair PNG3개를 직접 HTTP로 받아 검사 빌드와 SHA-256 동일 확인. 실제 브라우저/휴대폰 미확인.

## v208 긍정 유리 미반영 배포 수정 — 완료 / v209 공개 배포
- 사용자 스크린샷에서 이전 어두운 유리가 표시됨. 공개 주소 직접 HTTP 확인: HTML에는 pixel-rpg-positive.js 태그가 없고 최신 pixel-rpg.js/positive 모듈 자체는200 응답. v208 배포 tar의 client/index.html과 Worker 내장 HTML에도 태그가 빠져 있었음. 소스와 직후 문서용 재빌드 tar에는 태그가 있었으므로 클라이언트 캐시로 단정하지 않음. 최신 소스와 다른 빌드 산출물을 배포한 문제.
- scripts/check-deployment-entry.cjs 추가: 실제 dist 또는 최종 tar의 HTML=현재 소스, 로컬 스크립트69개 내용/순서/새 모듈 연결, Worker 내장 HTML, PNG3개를 바이트 비교. npm run build에 이 검사를 필수로 연결.
- pixel-rpg-positive 검사를 소스 모듈2개 임의 로드 방식에서 실제 index.html이 참조하는 순서로 로드하도록 수정. PIXEL_RPG_TEST_ROOT=dist/client로 배포할 파일의 PNG·렌더·UI/JSON/Undo까지 실행 가능. 기존 v208 tar에서 회귀 검사 실패 재현, 새 빌드에서 통과 확인. 소스 검사/빌드/배포 성공만으로 공개 HTML 반영을 확정하지 않는다는 교훈.
- 배포 준비 시 helper 안에서 build→산출물 기반 렌더 검사, 패키징 후 최종 tar 검사 후 저장/배포. v209 native 배포 성공. 공개 주소의 루트 HTML·관련 JS2개·PNG3개를 HTTP로 다시 받아 검사한 빌드와 SHA-256 동일 확인. 이제 실제 공개 HTML에도 새 모듈 태그가 있음.24/24 회귀 검사·빌드 검사·dist 렌더 검사·최종 tar 검사 통과. 실제 브라우저/휴대폰 검증은 별개로 미확인.

## 긍정 가치 유리 PNG3색·6상태 — 구현 v208 / 최초 배포 HTML 누락은 위 수정 참조
- 사용자 승인 시안3장(블루 정의감/핑크 사랑/오렌지 우정)을 imagegen으로 글자 없는 투명 PNG로 분리해 public/pixel-rpg/positive-{blue,pink,orange}.png에 반영. 새 public/pixel-rpg-positive.js가 동일한 금색 틀과 유리 영역을 분리해 편집 가능한 이름/수치를 조합.
- 100% 별도 찬란한 원본, 80~99/60~79/40~59/20~39/0~19%5단계. 단계별 광채/혼탁/균열 질감을 선택하고 같은 단계 안에서는 고정 크기 빛 질감을 가로 clip해 연속 감소.0% 실제 PNG 투명 구멍·파편과 분절한 글자 획. 이름은 PNG에 고정하지 않음.
- 선택 pixelPositiveTheme: blue/pink/orange/legacy, 누락=blue. 새 기본 이름 정의감, 이전 저장본의 사용자 이름은 유지. 색상 프리셋 버튼은 해당 예시 이름까지 한 Undo로 적용, 이후 자유 수정. legacy는 v207의 어두운 유리/균열 방식. 기존 pixelLowerShatter 토글은 파손·혼탁을 끄며 수치에 따른 빛 감소는 유지.
- loadPixelRpgAssets가 새 PNG3개 로드를 기다려 화면/프로젝트 재열기/페이지 썸네일/출력 모두 gameUIBitmap→pixelRpgBitmap 공유. 하단 실제 수치에 연동, 독립 입력 지원. 캐시24항목, 텍스트/수치/테마/파손 옵션 포함. 위 타락 게이지·HP/탄약·이미지 저장 규격 보존.
- tests/pixel-rpg-positive.cjs: 실제 PNG/Canvas 3색·각 구간 경계·100전용·고정 질감/clip·투명 구멍·이름 변경·JSON 일치·프리셋/Undo/busy/stale·기존 스타일·연동/독립·드래그 취소 검사. 렌더를 확대한 docs/design/pixel-rpg/positive-render-preview.png 시각 확인.24/24 선별 검사·구문 검사·빌드 통과, Sites native 공개 배포 성공. 실제 브라우저/휴대폰 미확인. 제작 기록 docs/design/pixel-rpg/positive-glass.md.

## 도트 RPG 하단 유리·글자 파손 — 완료 / v207 (현재 legacy 스타일)
- gamePreset:4 하단 상태 이름과 수치를 동일 유리 조각에 렌더. 아래 수치100%는 기존 모습 그대로, 감소 시 고정 균열이 점차 뻗고55%이상 손상부터 조각/글자가 어긋남.0%에서 일부 조각과 글자 획이 떨어져 나감. 이름은 사용자 편집값을 그대로 사용하며 정의감에 고정하지 않음.
- pixelLowerShatter 선택 boolean(누락=true), 새 객체true. 대사 편집의 아래 이름·수치 유리 파손 연출 체크로 끌 수 있음. 연동 시100−pixelValue, 독립 입력 시pixelLower를 기준으로 같은 파손 적용. 금색 외곽/위 게이지/HP는 변경하지 않음.
- drawPixelRpg 공통 경로로 화면/PNG/썸네일·복제/JSON 복원에 동일 정지 연출. 난수/시간 없이 결정적 조각이며 글자 자체를 잘라 이동·누락시킴. 실제 파편 애니메이션은 아님. 캐시12개 제한.
- tests/pixel-rpg.cjs: 실제 Canvas100/50/10/0 단계·정의감/수치 모두 파손·글자획 누락·외곽틀 불변·토글/Undo/JSON/기존파일/독립 수치·기존 드래그 취소 검사. 렌더 확대 시각 확인 docs/design/pixel-rpg/glass-shatter-preview.png. 선별23/23 검사·구문 검사·빌드 통과. Sites native 공개 배포 성공, 실제 브라우저/휴대폰 미확인.

## 참고56종 더블탭 편집 — 완료 / v206 공개 배포
- 빠른 편집이 text/canDirectTail만 대상으로 삼아 kind:asset 참고 말풍선56종을 누락한 오류 수정. canMiniEditText로 대사 편집 가능 여부를 꼬리 기능과 분리.
- 참고 말풍선은 더블탭/더블클릭으로 대사·글꼴·크기·가로/세로쓰기 편집. PNG 원본 꼬리/테두리와 이미지 모서리 기능은 이 팝업에 노출하지 않음. 고정 PNG 문구는 제외하며 별도 대사가 있는 assetComposition은 허용.
- tests/mini-edit-gesture.cjs에서 실제 reference-data 56개 모두 터치/마우스와 실제 입력 핸들러·기록·JSON 검사. 단일 탭/이동/핸들/다른 대상/화면 이동/호환 이벤트 검사 유지. 기존22개 회귀 검사 + 보강 제스처 검사 통과, 구문 검사/빌드 통과. 실제 브라우저/휴대폰 미확인.

## 굿/배드 필터와 능력치 변화5종 — 완료 / v205 공개 배포
- 아이콘 선택기와 게임 메시지 템플릿 선택기에 전체/굿 스테이터스/배드 스테이터스 필터 및 이름 검색. 공용 벡터8개는 아이콘 선택기의 공용 항목. 분류·검색은 편집 UI만 바꾸며 캔버스 표시/데이터/Undo를 변경하지 않음.
- 굿 기본 아이콘: level_up/atk_up/mag_up. 나머지 도트는 배드 기본 분류. 사용자가 정한 상태 효과를 게임 수치에 강제 적용하지 않음. 필터는 같은 객체/선택 항목의 편집 갱신에서도 유지, 현재 아이콘이 필터 밖이어도 선택값 보존.
- level_down(곤색 LV+↓),atk_up/down(검+금색↑/탁한곤색↓),mag_up/down(책+금색↑/탁한곤색↓) 아이콘/편집 가능한 메시지 템플릿5종 추가. 도트 총23종, 게임 메시지 템플릿11종.16px 투명/32px 정수2배와 기존 키 유지.
- 한국어 이름 및 LV/ATK/MAG·UP/DOWN 검색, 공백/대소문자/밑줄 무시, 결과 없을 때 안내. 필터 상태는 세션 UI 메모리에만 두며 저장 데이터 변경 없음.
- `tests/bad-status-filters.cjs`: 실제 시작/현재 메시지 분류·검색,아이콘 선택 보존,다시 sync 후 필터 유지,Undo 불변,영문/한국어 검색,신규5종 생성·JSON 검사. 아이콘23종/메시지11종 기존 검사 갱신.23/23 선별 검사·구문 검사·빌드 통과. 실제 브라우저/휴대폰 미확인.

## 일반 RPG 아이콘·시스템 메시지6종 — 완료 / v204 공개 배포
- 레벨 업(LV+금색↑),HP LOW(붉은HP+아래↓),MP LOW(푸른MP+아래↓),저주받음(보라해골),출혈(붉은방울),갑옷 파괴(흉갑+번개균열) 추가. 기존12종의 키 유지, 도트 총18종.16px 투명 원본/32px 정수2배,1px외곽/3~5색.
- 게임 → 상태창·프로필 → 게임 시스템 메시지에6개 바로 추가 카드. 기존 시스템 메시지 편집기 → 게임 메시지 템플릿에서도 카드 선택으로 현재 창에 추가. 최초 빈 메시지는 대체, 내용이 있는 메시지는 독립 행 추가·선택. 기존 사용자 헤더와 다른 행 보존, 최대32행·Undo1회·busy/stale 방어.
- `BAD_STATUS_MESSAGE_TEMPLATES`는 편집 가능한 초기 문구/아이콘/기본 강조색만 제공. 제목·설명·아이콘·색상은 기존 편집기로 수정, 상태 데이터에 특정 효과를 강제하지 않음. 기존8개 메시지 유형/저장 형식은 유지.
- `tests/bad-status-rpg-messages.cjs`: 실제 시작 카드/현재 메시지 버튼6개,수정 독립성,기본문구·아이콘,JSON렌더,복수행·프리셋 선택·Undo·상한·stale/busy 검사. 아이콘 전체18종 규격/복원 검사.22/22 선별 검사·구문 검사·빌드 통과. 실제 브라우저/휴대폰 미확인.
- 제작은 `scripts/make-bad-status-icons.cjs`, 이름표 시트/manifest/원본 픽셀맵 함께 재생성. 아이콘18종 ZIP/시트 배포본도 재생성.

## 복수 상태 동시 표시 — 완료 / v203 공개 배포
- 목록 편집 상단에 상태 개수와 추가 버튼 배치. 예시 여러 개 추가에서 체크한 상태를 한 Undo로 함께 추가, 한 창에 모두 표시하고 높이 자동 증가. 기존 항목별 이름/아이콘/설명 편집 유지.
- 목록의 여러 상태로 메시지 만들기에서 체크한 상태들을 한 통합 시스템 메시지로 생성. 독립 메시지에서도 상태 추가 및 기존 목록에서 여러 개 가져오기 가능. 항목별 아이콘·제목·설명, 선택 편집/정렬/삭제·더블탭/더블클릭 지원. 선택된 메시지 행만 편집, 최초 빈 자리 가져오기는 선택 항목으로 대체.
- `statusUI.version:1`에 선택 `messageRows:[{id,title,description,icon}]`/`selectedMessage` 확장. 기존 단일 messageTitle/Description/Icon 데이터는 그대로 렌더·편집해 호환. 메시지 최대32행, 제목1000/설명4000자, 자동 높이 최대30000px, JSON/프리셋 검증 및 행별 업로드·도트 아이콘 복원.
- 생성 메시지는 원본 상태의 복사본. 복제/프리셋은 메시지 행ID도 새로 만들고 선택행 매핑 유지. 화면/출력/썸네일 공통 렌더와 native 이동·회전·크기·가시성 경로 유지.
- 선별21/21 검사와 빌드 통과. 검사 `tests/bad-status-multiple.cjs`: 실제 체크박스 다중 추가/Undo,3상태 통합,행별 빠른 편집·독립성,정렬/삭제,프리셋/복제/JSON,도트/업로드 복원,32개 상한,단일 구버전 호환. 실제 브라우저/휴대폰 미확인.

## 상태 시스템 전체 편집 점검 — 완료 / v201 공개 배포
- 접힌 구역에서도 헤더/제목/설명/상태 이름 더블클릭·더블탭 시 해당 구역을 먼저 열고 입력칸으로 이동하도록 수정.
- 상세 영역의 이름 숨김, 독립 메시지 제목/설명 숨김을 공통 렌더에 반영. 메시지 편집에서는 관련 없는 상태 목록 전용 표시 토글을 노출하지 않음.
- native 상태 목록 복제 시 항목ID를 새로 발급하고 선택 항목을 대응시켜 유지. 기존 저장 복제본처럼 서로 항목ID가 같아도 메시지 원본 선택은 소유 객체ID+항목ID로 구별.
- 프리셋 적용 시 선택 상세 항목을 보존. 긴 사용자 자동 문구는 제목1000/설명4000자 규격으로 제한해 저장/재열기를 막지 않음. 너무 큰 프리셋 파일 오류 안내, 업로드 취소 정리, 포커스 상실 시 정렬 제스처 취소 보강.
- 엄격 DOM 대역으로 전체 필드/기본 아이콘20종/업로드/없음/스타일·토글/단계·시간·등급·중첩/효과·조건 정렬/프리셋 JSON/실제 복제 버튼/예전 중복ID 원본 선택 경로를 검사. 실제 DOM의 readonly type, 접힌 details 포커스 차단, select 기본값, DOM 삭제 시 ID 제거 포함.
- 기존 에로스탯·프로필·SNS·메신저·라이브·신분증 검사에서 이전 dist 경로/세션별 출력 경로/빠진 의존성 복구. 제품 기능 오류와 테스트 환경 노후화를 구분. 실제 브라우저/휴대폰은 미확인.
- 검증: `node scripts/check-editor-audit.cjs` 선별20/20 통과, `npm run build` 및 JS 구문 검사 통과. 검사 범위 전체가 실제 브라우저/실기기 통과를 의미하지 않음.

## 상태 시스템 빠른 편집 오류 수정 — 완료 / v200 공개 배포
- 사용자6605.jpg의 하단 오류와 동일하게 textarea.type(읽기 전용) 대입 시 TypeError로 편집 패널 생성이 중단됨. field 생성기에서 input에만 type을 지정하도록 수정.
- 앞선 VM DOM 대역이 textarea.type 읽기 전용 제약을 재현하지 않아 놓친 오류. 테스트 대역에서 textarea/select.type 대입을 거부하고 실제 sync 경로를 실행하도록 보강, 수정 전 동일 오류 발생·수정 후 통과 확인.
- 독립 시스템 메시지 제목/본문 및 상태 이름/설명 실제 입력칸 생성, 한 번 탭 미편집, 더블탭/더블클릭 포커스·내용 변경 검사 통과. mini-edit-gesture 및 빌드 통과. 실제 브라우저/휴대폰은 미확인.

## 범용 배드스테이터스 + 도트 아이콘 — 구현 완료 / v199 공개 배포
- 게임 → 상태창·프로필 → 범용 상태 시스템. 기존 에로스탯·도트 RPG 편집 메뉴에도 상태이상/시스템 메시지 추가 버튼 연결.
- 상태 최대32개, 이름·설명·분류·아이콘·색상·단계·시간·등급·중첩·효과·해제조건 편집. 복제/삭제/위아래/포인터 정렬, 목록/아이콘/이름/카드·선택 상세 영역·전체 표시 토글.
- 독립 시스템 메시지8유형, 상태 데이터 자동 문구 후 직접 수정.5디자인과 배경/테두리/텍스트/여백/간격, 기기·프로젝트 프리셋 및 JSON 백업. 예시는 직접 선택 추가, 기본 상태명 고정 없음.
- `items[].statusUI.version:1`을 기존 narration 객체에 저장, native 이동/크기8점/회전/레이어 표시·숨김·Undo 사용. 상태 객체는 꼬리·연결·비틀기 제외. 상태창 parentId는 편집 연결만 담당하며 팝업은 독립 객체.
- 도트12종16×16 투명PNG(3~5색/1px외곽)와32px정수2배판, 기본 아이콘 갤러리 연결. 업로드/없음도 지원. `public/bad-status-icons/`, 재생성 `scripts/make-bad-status-icons.cjs`, 이름표 시트 `docs/design/bad-status/icon-sheet.png`.24px 및2차 확장15종은 미제작.
- 저장/복원/출력/활성 및 복원 썸네일은 공통 drawBadStatus/loadBadStatusAssets. 한 번 클릭/탭 선택·이동, 더블클릭/더블탭 이름/설명 편집. 상태 추가·복제 시 높이를 늘리며 이후 문구 넘침은 내용에 맞춰 높이 조절.
- bad-status, bad-status-icons, object-rotation(상태패널 native dispatch/숨김/핸들 포함), mini-edit-gesture, pixel-rpg, nikke-consult-popup, layer-visibility, arknights-ui 및 빌드 통과. 실제 브라우저·휴대폰 미확인.
- 자세한 데이터·범위·제약은 `docs/design/bad-status/README.md`. 프리셋은 기기/프로젝트 저장이며 서버 계정 공유는 없음.

## 말풍선 색상 구역 제목 — 반영 완료 / v198 공개 배포
- 사용자 첨부1792291391340.jpeg 기준으로 워드아트 세부 조절 아래, 글자/바탕/테두리 색상 행 위에 기존 hr 분리선과 굵은 말풍선 제목 추가.
- 제목16px/700으로 기존 색상 라벨14px보다 약간 크게 표시. 색상 행과 aria-labelledby로 연결. PC/모바일 공통 마크업/CSS이며 기능 변경 없음.
- HTML 순서/중복ID 및 CSS 크기·굵기 확인, 빌드 통과. 실제 브라우저/휴대폰 미확인.

## 명일방주 한국어 기본 문구 — 구현 완료 / v197 공개 배포
- 사용자6579.jpg 한국어 화면 기준으로 Day·Night 기본 메뉴를 편성/오퍼레이터/구매센터/공개모집/헤드헌팅/임무/기반시설/창고/친구/파일로 변경. 터미널·이성·현재·올 클리어·모집·대사·일수 표기도 한국어 적용. Day/Night와 LV 표기는 유지.
- 새 레이어는 한글 기본값. 기존 저장본은 예전 기본 영어와 정확히 일치하는 값만 한글로 표시하며 loadArknightsAssets에서 한글로 복원해 다음 JSON 저장에도 반영. 직접 수정한 문구와 업로드 그림 속 글자는 보존.
- 순수 표시 getter와 복원 변환을 분리해 출력/썸네일/미리보기도 일치. tests/arknights-ui.cjs에서 두 테마의 예전 영어 기본값/새 한글 기본값 렌더 픽셀 일치, 표시의 원본 불변, 복원 후 한글 JSON, 사용자 문구 보존 및 기존 기능 검사 통과. 빌드 통과, 실제 브라우저/휴대폰 미확인.

## 명일방주 홈 화면 — Day / Night 구현 완료 / v196 공개 배포
- 사용자 첨부10번=Day, 9번=Night. 두 테마가 같은 편집값을 공유한다. 게임 → 명일방주에 추가. 기본 새 가로 장1536×864, 현재 장 추가도 선택. 다른 비율에서16:9 구도를 보존하고 남은 부분 투명.
- `public/arknights-ui.js`, gameui gamePreset:5. Day 밝은 패널/검정 글자, Night 어두운 패널/흰 글자, 상점/모집 청록색 공통. 상단/우측 메뉴 기울기·그림자, 좌측 레벨/비서 대사/뉴스 구현.
- 닥터 이름·대사·레벨/경험치·이성(최대 초과도 가능)·재화·시각·진행/모집/배너 문구·알림 입력. 각 메뉴 문구/표시와 그룹별 표시. 배경·캐릭터·오른쪽 배너·왼쪽 뉴스 그림4종, 배경 확대/위치와 캐릭터 위치/크기 조절.
- 테마 전환·편집 checkpoint 경로. 공통 저장 검증/복원·화면/출력/페이지 썸네일에 연결. 그림 캐시는 소스별 공유로 복제 레이어도 즉시 렌더. 업로드16MB/1,600만픽셀 이하 및 stale/busy 보호.
- 제공 스크린샷을 기준으로 벡터 재작성한 첫 버전이며 원본 전용 폰트·세부 아이콘의 픽셀 동일 복원은 아님. 참고 원본과 기록 `docs/design/arknights/`. 나머지8개 테마 미구현.
- tests/arknights-ui.cjs: 실제 Canvas/폰트 팔레트·테마 전환 값 보존/Undo·개별 메뉴/문구·프리셋 검증/dispatch·투명/종횡비·이미지/복제/JSON·업로드 방어·DOM 연결 통과. nikke-consult-popup, pixel-rpg, game-dialogue-gradient, layer-visibility 통과. 실제 브라우저/모바일 미확인.

## 니케 상담 확인 팝업 통합 — 구현 완료 / v195 공개 배포
- 상담 화면의 파란 상담 버튼을 클릭/탭하면 같은 레이어에 확인 팝업을 표시한다. X·취소·확인·팝업 바깥으로 닫는다. 확인은 편집용 닫기이며 상담 횟수 같은 게임 수치를 변경하지 않는다.
- 새 템플릿 목록과 일반 UI 종류에서 별도 상담 확인 팝업 항목 제거. 과거 nikkeType:confirm 저장본은 그대로 열리며 닫을 때 consult로 전환해 통합 편집한다.
- 선택한 상담 화면에 1회성 편집 안내를 표시. 캔버스 빈 곳 한 번 누르면 세션에서 해당 레이어의 안내만 사라짐. 안내는 프로젝트/출력/썸네일에 들어가지 않음.
- 선택 필드 nikkeConfirmOpen:boolean(누락=false), nikkePopupText/nikkeDim 재사용. 대사 패널에서 열기·닫기와 문구/명도 편집, 저장·복원·출력·썸네일 공통 렌더. 팝업 열기/닫기는 checkpoint1회.
- 드래그/핀치/취소/페이지 이동/화면이동·다중선택·다른 도구·가려진 말풍선 보호. 팝업 뒤의 즐겨찾기/일지 조작 차단, 닫은 뒤 합성 click/dblclick 전파 차단.
- tests/nikke-consult-popup.cjs 실제 Canvas 기존 팝업 픽셀 일치·저장JSON·기존파일·1회 안내/비출력·Undo·제스처·해상도 좌표·패널 편집 검사 통과. nikke-details, nikke-bonded-asset, mini-edit-gesture, pixel-rpg 검사 및 빌드 통과. 실제 브라우저/모바일 미확인.

## 도트 RPG 상태창 — 구현 완료 / v194 공개 배포
- 사용자 시안 승인 후 게임 → 도트/RPG 상태창 추가. `public/pixel-rpg.js`, `public/pixel-rpg/atlas.png`. 기존 gameui의 새 gamePreset:4이며 0~3 번호 유지.
- 0~99%는 고정 전체 질감을 아래부터 clip으로 노출. 0% 채움 없음, 정확히100%는 별도 검붉은 결정 코어. 원본 캐릭터/장면은 포함하지 않음. 장식 프레임 외곽은 투명 처리.
- 캔버스 세로 드래그로 게이지, 가로 드래그로 HP 변경. 한 제스처에 checkpoint1개, pointercancel/핀치/포커스 해제 시 원래 값 복구. 현재 캔버스 크기로 좌표 계산.
- 위쪽 이름(기본 타락률)과 아래 이름(기본 청렴도) 모두 40자까지 수정 가능. 아래 수치는 기본100−게이지 연동, 연동 해제 시 별도 입력. HP/최대HP/탄약, 개별 표시, 위치·크기 입력 지원.
- 그림 삽입/교체/제거·확대·위치·표시 지원. JSON 검증/복원, 공통 화면·출력·페이지 썸네일 렌더에 연결. 숨김은 기존 레이어 목록 사용.
- `tests/pixel-rpg.cjs`: 실제 atlas와 한글 폰트로0/50/99/100·동일 좌표 질감 불변·외곽투명·이름 편집/JSON·검증·드래그/Undo/취소·HP 좌표·그림 표시 검사 통과. `nikke-bonded-asset`, `nikke-details`, `game-dialogue-gradient`, `mini-edit-gesture` 통과. `npm run build` 통과. 실제 브라우저/모바일은 미확인.
- 승인 시안과 제작 기록: `docs/design/pixel-rpg-status-concept.png`, `.md`.

## 대각선 말풍선 검토 결과
- 2026-10-16 비교 시안(14종)을 보고 사용자가 대각선 꼬리 구현 승인. 기본/대각선 꼬리/본체25° 회전 PNG 2장은 검토 참고 자료이며 본체 회전은 기존 기능 유지.
- 선택 방식은 기존4방향 버튼을 늘리지 않는 근접3버튼 팝업으로 확정.

## 최근 완료 동작 — 다시 구현하지 말 것
| 기능 | 동작 | 주요 소스 / 검사 |
| --- | --- | --- |
| 레이어 표시/숨김 | 레이어 탭에서 종류/이름/미리보기와 눈 버튼. 숨긴 항목 유지, 프레임 숨김은 연결 사진/돌출까지 적용 | `public/layer-panel.js`; `tests/layer-visibility.cjs` |
| 크기·회전 핸들 | 선택 테두리에서 8점 크기 조절과 위쪽 원형 회전. 본체 이동 유지, 각도 입력 버튼 별도 | `public/object-rotation.js`, `corner-fit.js`, `mobile.js`; `tests/object-rotation.cjs` |
| 손에 든 폰 화면 | 사용자 참고 3종 + 투명 남자 손+폰 1종 + 첨부 터치 구도 1종 + 시트 9종. 액정 더블클릭/더블탭 또는 사진 버튼으로 삽입·교체. 액정 사진 위치·확대와 첫 구도의 여성 네일 색·원본 복원 | `public/phone-frames.js`, `phone-frames/`, `image-layers.js`, `studio.js`; `tests/phone-frames.cjs` |
| 가로 라이브 시간 | 다크 긴/묶음 채팅 및 플레이어가 있는 핑크 미니·프로필 카드의 라이브 시간 입력. 기존 파일은 `00:24:18` 기본값 유지 | `public/stream-templates.js`; `tests/asset-warp-live-time.cjs` |
| 고정 에셋 색·비틀기 | 대사·스타일 패널의 고정 에셋 편집에서 선·글자/바탕 색 변경, 원본 색 복원. 윤곽 뒤틀기에서 8점 드래그/모양 초기화 | `public/sticker-assets.js`, `references.js`, `warp.js`; `tests/asset-warp-live-time.cjs` |
| 흰 말풍선 식자 지우기 | 식자 도구에서 사각형 드래그 영역을 흰색으로 덮음. 원본 배경과 일반 이미지 레이어 지원. 테두리·장식은 사용자가 영역에서 제외 | `public/white-lettering.js`, `lettering.js`, `image-selection.js`; `tests/white-lettering.cjs` |
| 이미지 지우기 캐릭터 보호 | 자동 선택 마스크 생성 후 캐릭터 바깥만 브러시로 지움. 즉시 배경 전체 제거 기능은 아님 | `public/image-selection.js`, `image-layers.js`, `protrusion-ai.js`, `protrusion-ai-worker.js`; `tests/image-selection.cjs` |
| 불투명/반투명 전환 | 바로 편집에서 100%/55% 전환, 상세 슬라이더 유지, 연결 풍선 스타일 동기화 | `public/corner-fit.js`; `tests/balloon-opacity.cjs` |
| 바로 편집 제스처 | 클릭·탭은 선택/이동, 더블클릭·더블탭에서 말풍선·텍스트·이미지 팝업. 드래그 때 숨김 | `public/corner-fit.js`, `mobile.js`; `tests/mini-edit-gesture.cjs` |
| 연속 빈 컷 업로드 | 첫 이미지 삽입 후 다른 빈 컷도 더블클릭/더블탭으로 계속 삽입 | `public/empty-panel-upload.js`, `mobile.js`; `tests/empty-panel-upload.cjs` |
| 세로쓰기 정렬 | 가장 긴 열 기준으로 블록 정렬하고 모든 열의 시작 높이 통일 | `public/lettering.js`, `app.js`; `tests/vertical-alignment.cjs` |
| 신분증 템플릿 | 시민증·학생증·케이스형 직원증, 초상과 텍스트 편집 | `public/identity-cards.js`; `tests/identity-cards.cjs` |
| 사용자 폰트 유지 | 브라우저 폰트 보관 및 프로젝트 복원 경로 | `public/font-storage.js`, `font-import.js`; `tests/font-persistence.cjs` |

## 코드 찾기
- 앱 상태·렌더·텍스트: `public/app.js`; 프로젝트/페이지 저장·썸네일: `public/studio.js`, `autosave.js`.
- 말풍선: `public/balloons.js`, `corner-fit.js`; 에셋: `sticker-data.js`, `sticker-assets.js`, `custom-assets.js`, `shared-assets.js`.
- 컷/이미지: `public/panels.js`, `image-layers.js`, `panel-photo-zoom.js`, `empty-panel-upload.js`, `empty-photo-upload.js`, `warp.js`.
- SNS 프로필: `public/sns-profiles.js`; 메신저: `messenger.js`; 게임: `game-ui.js`, `momotalk.js`; 라이브: `live-layouts.js`, `vertical-stream.js`, `live-chat-generator.js`.
- 에로스탯: `public/eroste*.js`; 파트너 정보와 중앙 빈 공간 사진 삽입, 중앙 그림 세로 위치 조절 경로를 유지한다.
- 텍스트 단축키: Ctrl+B/Ctrl+I 경로와 `tests/text-style-shortcuts.cjs`.
- 스타일/모바일: `public/style.css`, `renewal.css`, `mobile.js`; PWA: `pwa.js`, `manifest.webmanifest`.
- 호스팅: `.openai/hosting.json`의 D1 `DB`, R2 `BUCKET` 유지. Worker는 `worker/index.js`.

## 편집 데이터 주의
- `imageLayers[].strokes`에 일반 지우기, 보호 지우기, 흰 덮기를 함께 저장한다.
- 보호 마스크 PNG는 `eraseSelections`, 현재 선택은 `eraseSelection`, 모드는 `eraseOutside`. 각 보호 stroke는 생성 당시 selection 인덱스를 보관한다.
- 흰 덮기 stroke는 `whiteText:true`와 정규화된 4개 꼭짓점. 투명 픽셀은 보존한다. 배경에는 기존 `state.masks` 사각형을 추가한다.
- 로드할 때 마스크 비트맵을 복원해야 한다. 썸네일도 `applyImageEraseStrokes` 경로를 사용한다. 모드 변경이 과거 stroke 결과를 바꾸면 안 된다.

## 검증과 남은 확인 범위
- 신규 참고 3종: `phoneType` 11–13, `screenReplace:true`, 원본 파일은 `reference-front-a.png`/`reference-tilt.png`/`reference-front-b.png`. 원본 손·폰 외곽·배경 alpha는 변경하지 않으며, 런타임 액정 마스크가 갤러리·글자·UI 버튼만 대체한다. 실제 노치와 액정 앞 손가락은 유지한다. 내부의 원본 투명 구멍도 사진으로 채운다.
- `phone-frames.cjs`에 14종 실제 사진 채움·JSON 검사를 적용. 신규 3종의 마스크 밖 모든 픽셀이 디코딩한 원본과 같은지 검사 통과. 출력 시트로 기울어진 폰과 손가락 가림 확인. `mini-edit-gesture` 검사 통과. 실제 브라우저·모바일 확인은 미실시.
- 새 투명 소재: `public/phone-frames/male-hand.png` (1024×1536 RGBA), built-in imagegen으로 생성. 실제 alpha=0 외곽/손가락 사이 확인, 원본 alpha 보존. 생성 프롬프트는 `docs/assets/male-hand.md`.
- `phoneType:10`을 끝에 추가해 기존 0–9 번호 유지. 선택 목록에서 새 투명 소재를 맨 앞에 표시. 새 장 체크 기본은 꺼짐; 현재 장에 너비 최대 440px/캔버스 60%·높이 80%로 넣고 현재 뷰포트 근처에 배치한다. 새 장 체크 시 원본 비율 장으로 추가한다.
- `phone-frames.cjs`: 11종 실제 액정 채움, 새 소재 외곽 alpha=0, 손/폰 원본 픽셀 보존, 다른 배경과 합성, JSON/로드/썸네일, 현재 장 추가 시 페이지 수·비율·위치 보존 검사 통과. `mini-edit-gesture` 및 빌드 통과. 실제 브라우저·모바일 UI는 미확인.
- 이번 보정: `tests/phone-frames.cjs`에서 원본 화면 잔여물 위치가 삽입 사진으로 바뀌는 실제 픽셀, 외곽/손 사이 빈 영역의 alpha=0, 엄지·검지 손톱만 색이 바뀌고 옆 피부는 그대로인 픽셀 검사 추가. 출력 확대 확인, 기존 10구도·저장·복원·썸네일·Undo·제스처 및 `mini-edit-gesture` 검사와 빌드 통과. 브라우저·실제 모바일 수정본은 미확인.
- 폰 프레임: `tests/phone-frames.cjs`에서 10구도의 실제 Canvas 화면 삽입 픽셀, 폰/손·노치 보존, 터치 손 네일 색과 복원/Undo, JSON/검증/로드, 편집·출력 렌더 경로, 회전·크기 변경 후 화면 hit, 비활성 장 썸네일, 더블탭/더블클릭·드래그 제외, 오래된 업로드 취소, 새 장 추가 busy 수명주기를 확인했다. `empty-panel-upload`, `mini-edit-gesture`, `object-rotation` 회귀 검사 통과. 브라우저·실제 모바일 조작은 미확인.
- 폰 프레임 데이터: `imageLayers[].kind:'phoneframe'`, `phoneType` 0–13, `media` data URL, `mediaZoom` 100–300, `mediaX/mediaY` 0–100, `nailColor` 빈 문자열=원본 / hex=사용자 색. 원본 일러스트는 `public/phone-frames/touch.png`·`poses.png`; 코드는 crop/quad와 액정 마스크를 통해 렌더하므로 원본 파일을 수정하지 않는다.
- 터치 구도(phoneType=0)는 손·폰 외곽 배경과 두 손 사이의 빈 영역을 투명 처리한다. 다른 시트 9구도는 원본 배경을 유지한다. 사진 자동 맞춤은 정의된 액정 사각형의 원근 투영이며, 시트의 체크무늬는 PNG에 그려진 회색 영역을 연결 추출해 덮는다. 사용자 이미지에서 임의로 폰을 자동 인식하는 기능은 아니다.
- v171 작업: `asset-warp-live-time`, `sticker-paper-opacity`, `mini-edit-gesture`, `object-rotation`, `balloon-opacity` 검사 및 `npm run build` 통과. VM/Canvas 검사이며 브라우저·실제 모바일 터치 확인은 하지 못했다.
- PNG 에셋 비틀기는 원본 전체를 변형하므로 이미지에 포함된 글자·장식·연결 풍선도 함께 변형된다. 별도 편집 가능한 대사는 그대로 유지한다. PNG의 테두리만 분리해 변형하는 기능은 아니다.
- 에셋 비틀기는 `items[].warp` 8개 정규화 값(±0.28)을 사용하며, 표시·출력·썸네일은 공통 `drawReferenceBalloon` 경로를 사용한다. 원본 PNG는 변경하지 않는다. 비틀기 래스터는 최대 축 1000px/기본 50만 픽셀로 제한해 캐시한다. 큰 출력에서는 이 해상도 한계가 있다. 실기기 드래그 성능은 미확인.
- `imageLayers[].liveTime`은 선택 문자열(최대 12자). 오래된 프로젝트에 값이 없어도 허용한다.
- v169 당시 흰 덮기·보호 지우기·편집 제스처의 VM/Canvas 테스트 및 빌드 통과 기록이 있다. 이는 당시 검사 결과이며 이번 문서 작업에서 재실행한 것으로 간주하지 않는다.
- 자동 캐릭터 선택은 모델 다운로드와 로컬 추론을 사용한다. 실제 모바일 추론·성능과 실제 터치 UI는 마지막 기능 작업에서 확인하지 못했다. 가짜 worker 테스트를 실추론 성공으로 보고하지 않는다.
- 흰 식자 지우기는 수동 영역 덮기다. 자동 문자/말풍선 인식, 회색톤·그림 복원은 미구현이며 사용자도 흰 배경 이상의 기능을 요구하지 않았다.
- 모든 옛 테스트가 현재 빌드 경로와 맞는다고 보장하지 않는다. 실패 시 환경/테스트 노후화와 실제 회귀를 구분한다.

## 다음 세션
1. 최신 사용자 요청과 이 파일을 읽는다.
2. Sites에서 현재 버전과 소스를 확인하고 필요한 파일만 읽는다.
3. 요청 범위만 변경하고 관련 검사를 실행한다.
4. 결과·한계·다음 할 일을 기록하고 저장소에 보존한다. 배포 버전은 확인한 값만 기록한다.
