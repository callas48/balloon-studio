# 말풍선 공방 — GitHub 작업 규칙

- 시작 시 HANDOFF.md와 README.md를 읽고 사용자 지시를 우선한다.
- 편집기 원본은 public/, 서버 예시는 worker/, 빌드는 scripts/build.mjs. dist/는 생성물이다.
- 기존 사용자 문서/폰트ID/에셋번호/Undo·저장·썸네일·출력·PC와 모바일 제스처를 보존한다.
- 기능별 tests/를 선택해 실행하고 Canvas 검증과 실제 기기 확인을 구분한다.
- 이 저장소는 기존 Sites 운영 저장소와 별도다. 기존 서비스에 자동 배포하거나 과거 배포ID를 재사용하지 않는다.
- 명시적 사용자 요청 없이 다른 에이전트에 위임하지 않는다.
- 종료 시 HANDOFF.md와 CHANGELOG.md에 결과 및 미완료/검증 한계를 기록한다.

- GITHUB-SNAPSHOT.json은 이식 파일 무결성 목록이다. 스냅샷을 변경할 때 파일 크기와 SHA256을 함께 갱신하고 node scripts/verify-snapshot.mjs로 확인한다. 목록 자체는 자기 해시에서 제외한다.
- Windows 설치형 구현/운영 업데이트 연결/실기기 검증 범위는 HANDOFF.md와 docs/windows-desktop-plan.md 참조. 각 상태를 구분한다.

- 설치형 정책: 새 버전 알림 후 사용자가 클릭할 때 차등 다운로드, 저장 성공 후 설치한다. 오프라인/업데이트 서버 실패는 자동 알림 없이 처리하고 로컬 편집·저장·출력을 막지 않는다. 상세 요구사항은 docs/windows-desktop-plan.md. 구현·실제 패키지 검증 전에는 완료로 보고하지 않는다.

- 자동 업데이트 확인은 프로그램 실행당 시작 시 1회만 수행한다. 실행 중 주기 확인·창 포커스/연결 복구 시 재확인·실패 후 자동 재시도는 금지한다. 사용자 클릭으로 요청한 수동 확인과 구분한다.

- Windows0.1.1 NSIS는 과거 검사 기록이다. 현재는 0.3.3 실행 코드와 Sites v260을 병합한 0.3.4 MSI 빌드를 재구성했다. 최신 상태·실제 설치/ICE 미검증 범위는 HANDOFF.md와 docs/msi-reconstruction.md를 읽는다.
- MSI UpgradeCode·588개 기존 파일 GUID·사용자별 설치/데이터 경로를 보존한다. build/msi-0.3.3-identities.json을 임의 재발급하지 않는다. 기본 빌드는 ICE 활성화이며 --skip-ice-validation을 썼다면 이유와 검증 한계를 명시한다. 컴파일·소스 이미지 추출·실제 설치/업그레이드를 구분한다.
