# 프로젝트 전체 PNG ZIP 내보내기

2026-10-31 (Asia/Seoul).

v254 archive-backed 공개 배포 succeeded(2026-10-31 KST). 기능커밋d7ef51d12982db082a93f4e55c568e0bfdad0935, 배포ID appgdep_6ae59b6a53b88191930510c5030bd647. npm build·dist 긍정유리·최종tar90JS/HTML/Worker 일치 통과. 기존URL 공개반영은 네이티브 succeeded 응답으로 확인. 이 배포 결과를 기록하는 후속 커밋은 문서만 변경하며 별도 기능배포가 아님.

내보내기 → 저장 범위 → 프로젝트 전체 PNG · ZIP → 전체 PNG ZIP 저장. 현재 장 저장은 기존 PNG/WEBP/JPG와 화질 옵션을 유지한다. ZIP은 각 장의 원본 크기와 완성된 편집 결과를 포함한다. 원본 사진만 추출하는 기능이 아니다. 선택 핸들·가이드·편집 팝업은 포함하지 않는다.

파일은 현재 장 목록 순서의 `001_장 이름.png` 형식이다. 중복 이름도 번호로 구분하며 경로/금지 문자와 긴 UTF8 이름을 정리한다. ZIP 이름은 프로젝트 제목에 `_PNG.zip`을 붙인다. 현재 장의 아직 파일로 저장하지 않은 수정과 입력한 장 제목도 출력한다.

## 구조

- `public/export.js`: 저장 범위 UI, 공유 `prepareArtworkAssets`. 기존 단일 이미지와 일괄 출력이 같은 폰트/공용아이콘/말풍선/게임UI 대기를 사용한다.
- `public/batch-export.js`: 한 장의 문서만 structuredClone한 작업 복사본으로 처리한다. 기존 로더의 호환 기본값 보정이 원본을 바꾸지 않게 하고, 명시된 레이어 font는 로더 처리 뒤 보존한다. 현재 장은 `state`에서, 다른 장은 `projectBook.pages[].doc`에서 읽는다. 전체 book을 복제하거나 switchPage/flushPage로 장을 전환하지 않는다.
- 공통 `paintArtworkScene`과 `encodeArtwork('png')`를 사용해 원본 배경, 지우기/컷/사진, 글자·말풍선·검열 에셋을 합성한다. 원본 width/height 그대로 인코딩하고 처리한 Canvas 크기를 1×1로 줄여 픽셀 버퍼를 해제한다.
- 작업 중 `render`/`sync`를 가드해 폰트 비동기 완료 등의 콜백이 임시 장으로 화면·선택을 바꾸지 않게 한다. 원본 state/bg와 사용자 이미지·렌더 캐시/customAssetRegistry/clone-fill cleanup을 캡처하고 페이지마다 복원한다. 원래 장/선택/스크롤/Undo/Redo/dirty/ID/문서 데이터는 그대로다. pending 로더나 등록된 폰트 자체를 무작정 삭제하지 않는다.
- `public/png-zip.js`: 브라우저 안에서 ZIP을 작성한다. PNG 자체가 압축 형식이므로 추가 DEFLATE 버퍼를 만들지 않고 표준 ZIP STORE 엔트리로 묶는다. UTF8 플래그, CRC32, 생성 시각의 DOS 날짜/시간, 중앙 디렉터리를 기록한다. CRC는 PNG Blob을 1MiB 청크로 읽고 최종 ZIP은 Blob 부분들의 조합으로 만든다. 전체 PNG 배열버퍼/전체 프로젝트 Base64를 만들지 않는다. 별도 외부 라이브러리나 서버 업로드가 필요 없다.

## 오류·취소·한계

진행률과 현재 장 이름을 표시한다. 닫기 버튼 또는 Escape는 취소 요청으로 전환하며, 진행 중인 공유 로더/PNG 인코딩이 안전 지점까지 끝난 뒤 상태를 복원한다. 취소나 어느 한 장의 오류에서 부분 ZIP을 성공 파일로 내려받지 않는다. 오류 장과 메시지를 보여주며 다시 시도할 수 있다. 중복 시작을 막고 완료/실패/취소 모두 busy와 컨트롤 상태를 복원한다.

ZIP32 범위(4GiB 미만)와 엔트리 수를 검사한다. ZIP64는 지원하지 않으며 제한 초과 시 프로젝트를 나눠 내보내도록 안내한다. 압축된 PNG Blob들은 ZIP을 완성할 때까지 보관하므로 모든 프로젝트 크기의 메모리 안전을 보장하는 구조는 아니다. 큰 원본 문서의 기본 상주 메모리와 한 장의 임시 복사/디코딩/인코딩 비용, Blob 보관 비용은 남는다. 화면의 원본 장 캐시와 현재 출력 장을 유지하되 모든 장의 비트맵을 병렬로 열지 않는다.

이 작업은 PNG 출력이며 편집 가능한 프로젝트 JSON/자동저장을 대신하지 않는다. 기존 DB v2 저장과 되돌리기 수명 규칙을 변경하지 않는다. Windows MSI/GitHub 설치형 병합은 별도다.

## 검증

`tests/batch-export.cjs`는 실제 공통 장면·PNG 경로로 여러 크기의 배경/컷 사진/지우기/텍스트/검열을 렌더한다. 별도의 Python `zipfile`로 ZIP을 열어 CRC, UTF8 파일명·장 순서, PNG IHDR 해상도, 공통 단일 장면 출력과 정확한 PNG SHA256 일치를 검사한다. 활성 장의 최신 미저장 수정, font 보존, 원본 문서·장 순서·선택·이력·dirty·캐시 객체 참조 보존, 30장 순차 인코딩과 Canvas 해제, 실패·취소 버튼·Escape·중복 실행·ZIP32·저장 범위 UI도 검사한다.

기존 포켓몬/림버스 일반·투명 PNG, color-picker, font-persistence, 검열, 메모리·자동저장·입력 성능과 편집기 회귀를 수행한다. 새 공유 preload 함수를 선택 실행하던 기존 PNG 테스트에도 실제 함수를 연결했다.

이 결과는 VM 이벤트/DOM 대역, Native Canvas PNG 및 독립 ZIP 리더 검증이다. 실제 브라우저 파일 다운로드 창/Android 저장소 동작과 대형 4K 사진 30장의 실기기 메모리 사용 검증은 미확인이다. 기존 Worker 앱에 관리형 preview용 dev script/static.directory가 없어 실제 브라우저 QA 경로를 사용할 수 없으며, QA 우회 목적으로 운영 설정을 바꾸지 않는다.
