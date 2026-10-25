# 말풍선 공방 — GitHub 작업 규칙

- 시작 시 HANDOFF.md와 README.md를 읽고 사용자 지시를 우선한다.
- 편집기 원본은 public/, 서버 예시는 worker/, 빌드는 scripts/build.mjs. dist/는 생성물이다.
- 기존 사용자 문서/폰트ID/에셋번호/Undo·저장·썸네일·출력·PC와 모바일 제스처를 보존한다.
- 기능별 tests/를 선택해 실행하고 Canvas 검증과 실제 기기 확인을 구분한다.
- 이 저장소는 기존 Sites 운영 저장소와 별도다. 기존 서비스에 자동 배포하거나 과거 배포ID를 재사용하지 않는다.
- 명시적 사용자 요청 없이 다른 에이전트에 위임하지 않는다.
- 종료 시 HANDOFF.md와 CHANGELOG.md에 결과 및 미완료/검증 한계를 기록한다.

- GITHUB-SNAPSHOT.json은 이식 파일 무결성 목록이다. 스냅샷을 변경할 때 파일 크기와 SHA256을 함께 갱신하고 node scripts/verify-snapshot.mjs로 확인한다. 목록 자체는 자기 해시에서 제외한다.
- 현재 Windows 설치형 준비 범위는 docs/windows-desktop-plan.md 참조. 설치 파일이 만들어졌다고 가정하지 않는다.

- 설치형 정책: 새 버전 알림 후 사용자가 클릭할 때 차등 다운로드, 저장 성공 후 설치한다. 오프라인/업데이트 서버 실패는 자동 알림 없이 처리하고 로컬 편집·저장·출력을 막지 않는다. 상세 요구사항은 docs/windows-desktop-plan.md. 구현·실제 패키지 검증 전에는 완료로 보고하지 않는다.
