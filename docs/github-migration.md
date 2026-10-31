# 현재 상태 — 2026-11-01

저장소 callas48/balloon-studio의 private/쓰기 권한을 확인했다. 아래 초기 이식 준비의 접근 대기 기록은 과거 상태다. 현재는0.3.3 실행 코드와 Sites v260을 합친0.3.4 MSI 빌드를 재구성했다. 최신 상태는 HANDOFF.md와 docs/msi-reconstruction.md를 읽는다.

# GitHub 이전 준비 — 2026-10-25

## 확인된 상태
- 사용자 요청 계정 callas48. GitHub 연결의 인증 사용자도 callas48로 확인했다.
- GitHub 앱 연결 완료, 설치된 저장소 조회 결과는 비어 있다. callas48/balloon-studio 조회는404. 이 응답은 미생성 또는 앱 접근권한 부재이며 둘을 단정해서 혼동하지 않는다.
- 현재 GitHub 도구는 기존 저장소의 파일/트리/커밋을 작성하지만 저장소 신규 생성 도구는 제공하지 않는다. 원래 계정의 비밀번호나 토큰을 채팅으로 받지 않는다.
- 사용자가 비공개 저장소 생성 완료를 보고했다. 현재 도구의 callas48/balloon-studio 조회404 및 owner 목록빈결과로 업로드는 아직 못함. 먼저 실제 저장소URL 확인. 이름이맞으면 https://github.com/settings/installations 의연동앱Configure→Repository access에balloon-studio추가후Save. 계정연결/저장소신규생성을반복요청하지않는다.

## 준비한 이전용 소스
- scripts/prepare-github.mjs <새 절대경로>: 현재 Git 추적 파일에서 독립 초기 스냅샷을 만든다. 기존 목적지는 덮지 않는다. 원래 .git 이력/호스팅 .openai 설정과 임시 파일은 제외한다.
- 기존 public/ 편집기·폰트·라이선스 바이트 유지. 별도 README/AGENTS/파일 SHA256 목록 생성. 기존 운영자 이메일 allowlist를 제외하고 서버 관리자 쓰기는 기본 비활성으로 내보낸다. 인증 연동을 완성한 서버 배포본으로 설명하지 않는다.
- 내보낸 package.json에는 npm run dev 추가. scripts/dev-local.mjs는127.0.0.1 로컬 서버이며 폰트MIME·경로검사·읽기 전용 공용에셋빈목록/방문집계없음으로 편집기를 실행한다. 기본실행에 npm install 불필요. 일반 localhost 실행 방식이며 managed preview/브라우저 QA 우회용으로 실행하지 않는다.
- 내보낸 build는 원래 호스팅 설정 없이도 dist/client와server를 만들며 원래 build/호스팅 파일을 변경하지 않는다.
- GitHub 전송 전 실제 목적지 private 여부/인증사용자/쓰기권한 확인, 새 초기스냅샷 커밋으로 이전. 기존 배포 이력을 무심코 push하지 않는다.
- 이 준비는 GitHub 업로드 완료나 Electron/Windows 설치파일 제작 완료가 아니다. 공용서버 기능·기존 브라우저 DB자동이전·자동업데이트도 아직 구현한 것으로 표현하지 않는다.

## 검증
- tests/github-preparation.cjs: 로컬서버 HTTP/폰트원본/MIME/관리자false·빈목록·방문집계없음·경로탈출/메서드거부, 스냅샷운영설정/이력이미포함·관리자allowlist제거·원래편집기/라이선스동일·독립build·해시일치·기존디렉터리덮기금지.
- 실제 브라우저·Windows 실행은 미확인. GitHub 저장소 생성/전송/Windows설치형은 다음 작업이다.

## 사용자 진행 방침
비공개에 우선 업로드하고 폰트·에셋의 공개 배포 조건은 이후 공개 전환 전에 정리한다. 현재는 저장소 접근 확인만 대기하며 GitHub 쓰기나 공개 전환은 아직 없다.
