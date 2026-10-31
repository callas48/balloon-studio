# 여러 장 메모리·자동저장 복구 점검

2026-10-29 (Asia/Seoul). 조사 기준 Sites v251 소스 ad286649b0e10ffeb646ecdc389153c39fe7d135.

## 신고와 확인 범위

사용자가 전달한 신고: 간헐적 브라우저 Out of memory → 새로고침 화면, 자동저장 열기 실패로 약 30장 작업 유실. 신고자의 기기/브라우저/실제 IndexedDB 저장본/크래시 덤프에는 접근하지 않았다. 아래는 코드에서 확인된 결함·증폭 경로이며 해당 사고의 단일 원인 또는 원본 데이터의 물리적 삭제를 확정한 진단이 아니다.

최근 Worker 로그 조회에는 관련 서버 OOM 예외가 확인되지 않았고 대부분 별도 파일 404였다. 서버 로그는 사용자 브라우저 OOM을 포착하지 않으므로 무사고 증거로 쓰지 않는다.

## 확인한 경로

1. app.js checkpoint는 이미지·폰트 data URL까지 포함한 state 전체 JSON을 장마다 최대 35개 보관했다. studio.js flushPage는 각 장 history/future를 계속 보관하므로 프로젝트 크기에 따른 총량 제한이 없었다.
2. imageLayerImages/postMediaImages 및 source-keyed 프로필·메신저·게임 그림 캐시는 장 변경 뒤에도 이전 장의 디코딩 이미지를 계속 참조했다. 기본 Canvas 픽셀과 렌더 캐시도 원본 압축 파일보다 훨씬 커질 수 있다. 실제 크래시 기기의 메모리 점유량은 측정하지 않았다.
3. updatePageCard는 thumbnail이 없으면 원본 doc.image를 img.src로 사용했다. 30장 import/열기에서 목록만으로 원본들이 동시에 디코딩될 수 있었다. openBookFile도 누락된 비활성 썸네일을 모두 복원했다.
4. 자동저장은 serializableBook의 명시적 structuredClone 후 IDB.put의 구조화 복제를 또 거쳤다. 자동저장 열기는 읽어온 객체 전체를 JSON.stringify한 뒤 openBookFile에서 JSON.parse했다. 프로젝트 전체 문자열과 새 객체를 만드는 불필요한 피크 메모리 및 JS 단일 문자열 길이 제한 경로였다.
5. 기존 저장은 하나의 문서만 덮어썼다. 복구 실패는 캔버스 상태 메시지로만 표시될 수 있어 모달에서 원인이 보이지 않았으며, 열기 없이 백업하거나 문제 장을 피해 복구할 경로가 없었다.

## 변경

- project-memory.js: 프로젝트 전체 history+future 합계 24 Mi 문자 상한. 비활성 장 기록부터 정리하고 활성 장의 오래된 기록을 정리한다. 원본 문서/그림/저장본은 수정하지 않는다. 큰 문서에서는 되돌리기 횟수가 줄거나 단일 기록도 상한을 넘으면 남지 않을 수 있다. UI 되돌리기 툴팁에 자동 정리를 안내한다. 이 값은 문자열 길이 예산이며 실측 RAM 상한이 아니다.
- switch/open/restore/import/new 경계에서 활성 문서에 없는 사용자 이미지 캐시를 제거한다. 재진입 때 원본 src에서 로드한다. 공유 번들 아트/로더 pending은 임의 퇴출하지 않으며 export/썸네일 로드 중에 전역 캐시를 비우지 않는다.
- 목록은 작은 thumbnail 또는 placeholder만 사용한다. 열기 직후 모든 비활성 장의 썸네일을 렌더하지 않는다. 장을 방문하면 해당 장의 썸네일이 생성된다.
- openBookData로 IDB 객체를 직접 검증·열기. 일반 파일 입력은 기존 JSON parse 경로를 유지한다. 로드/렌더 실패 시 현재 문서를 롤백하고 이전 자산을 다시 로드한다. 실패했다고 원본 자동저장본을 지우지 않는다.
- 명시적 전체 structuredClone 제거. IndexedDB가 put 요청 시 스냅샷을 소유한다. 저장 revision/identity epoch 및 dirty 일정 처리는 유지한다.
- IDB 스키마 2: 기존 projects/summaries를 보존하고 recovery store만 추가. 최신과 직전 문서를 두 store에 번갈아 저장한다. 문서+요약은 한 트랜잭션으로 커밋하며 저장 공간 부족/충돌/중단 시 이전 커밋을 유지한다. 구형 요약은 slot 누락=projects로 읽고 첫 신규 저장은 recovery에 써 원본을 보존한다. 세 번째 이후 저장부터 두 세대 중 오래된 슬롯을 대체한다. 이는 같은 브라우저 안의 한 세대 추가 보관이지 독립 장기 백업이 아니다. 브라우저 저장 공간 사용은 늘 수 있다.
- 내 프로젝트: 파일로 백업(렌더 없음), 장별 복구(선택 장만 새 프로젝트로 열기), 이전 저장본 복구(존재 시). 복구본은 새 identity로 열어 원본 기록을 덮어쓰지 않는다. 일반 최신본 열기는 원래 identity/revision을 유지한다. dialog 실패 메시지와 close 시 복구 목록 해제도 연결한다.
- 프로젝트 파일 출력은 페이지별 JSON Blob 조각으로 작성해 기존 v3 JSON 구조/폰트/문자/그림을 보존한다. 전체 프로젝트를 단일 문자열로 만들지 않는다. 한 장 자체가 극단적으로 큰 경우의 문자열·IDB 객체 비용은 여전히 남는다.

## 검증

- tests/project-memory-recovery.cjs: 30장 직접 객체 복구에서 활성 이미지 1장만 디코딩, 전체 stringify 금지 상태의 저장본 열기, 한 장 복구와 새 identity, raw chunked JSON 백업의 바이트 내용 일치, 검증/렌더 실패 롤백, 활성 이미지 캐시 보존·이전 장 퇴출, 30장×35기록의 문자열 예산, 실제 writeLocal의 2세대 순환/원자적 실패/충돌/구형 요약/최신·직전 라우팅. VM과 트랜잭션 대역 검사이며 실제 브라우저 OOM 재현은 아니다.
- autosave-scheduling, editor-input-performance, font-persistence, limbus-ui, pokemon-gold-battle, pokemon-sunmoon 및 editor audit 24종 통과. 실제 폰트·Canvas 회귀는 기본 런타임 @napi-rs/canvas를 NODE_PATH로 사용한다.
- npm run build와 dist 긍정유리·최종 배포 tar 검사는 별도로 수행하고 결과를 HANDOFF/CHANGELOG에 기록한다.
- managed preview start는 기존 Worker 앱에 dev script/static.directory가 없어 실패. sites-preview status=stopped. 앱 운영 설정을 QA 우회 목적으로 바꾸지 않았다. 실제 브라우저 IndexedDB upgrade/할당량·30장 실기기 메모리/크래시 재현은 미확인이다.

## 배포 확인

v252 archive-backed 공개 배포 succeeded. 기능 소스 `770e8f5fb2287b30f6ec7aa1d081bfff94061dab`, 배포 `appgdep_6ae26307f4448191a00789cf6765e783`. npm build, dist 긍정유리, 최종 tar의 86개 JS·HTML·Worker 일치 통과. 실제 브라우저/기기 QA와는 구분한다.

## 남은 위험과 실제 사고 복구

저장 DB가 남은 원래 기기·브라우저·동일 사이트에서 ‘내 프로젝트 → 파일로 백업/장별 복구’를 시도할 수 있다. 아직 로컬 데이터가 남아있는지 접근하지 않았으므로 복구 가능이나 30장 복구 완료를 보장하지 않는다. 브라우저 데이터 삭제는 남은 DB도 지울 수 있다. 기존 사고 이전 저장본이 없었다면 이번 배포가 과거의 추가 세대를 만들어 주지는 않는다.

사진 원본·동일 폰트가 장마다 포함된 현재 v3 포맷과 전체 book의 IDB 저장 비용은 남는다. 대형 프로젝트의 다음 구조 개선 후보는 asset 중복 제거와 장 단위 저장/지연 로딩이다. 이번 변경으로 모든 기기의 OOM을 방지했다고 설명하지 않는다. 자동저장 주기는 기존 idle 20초/연속 편집 최대 60초이며 제스처·IME 중에는 안전 지점까지 대기한다. 브라우저 강제 종료 직전 미커밋 편집은 보장할 수 없다.

MSI/GitHub 설치형은 별도 작업이다. 이번 변경은 Sites 편집기에 적용하며 Windows 설치형 병합·검증 완료로 보고하지 않는다.
