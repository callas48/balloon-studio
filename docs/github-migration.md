# GitHub 소스 이전 — 2026-10-25

현재 대상은 callas48/balloon-studio 비공개 저장소다. main·읽기·쓰기 접근을 확인했으며 초기 README와 .gitignore 커밋을 부모로 보존하고 전체 소스를 main에 연결했다. Source 커밋: 0852d555f52b4ca9847c811c1ea8666cbabc094a. 바이너리 396개, 전체 파일 644개이며 각 경로/크기/Git blob 해시를 대조한다. 이전의 404·앱 설치 대기는 해결된 과거 상태다.

Sites v249 소스 140161c56a2ac05b135644ef5d592baf1fbfe2c0에서 scripts/prepare-github.mjs로 독립 사본을 만들었다. 원본 .git 이력과 .openai 호스팅 설정은 제외하고 서버 운영자 쓰기는 비활성으로 바꿨다. 원본 폰트·라이선스·이미지 바이트는 보존한다. 기존 서비스의 DB/스토리지/브라우저 자동저장 데이터는 자동 이전되지 않는다.

node scripts/dev-local.mjs로 실행하고 node scripts/build.mjs로 빌드한다. node scripts/verify-snapshot.mjs는 전체 파일 크기와 SHA256을 대조한다. GitHub tree 경로별 Git blob SHA1도 로컬 원본과 대조한다.

준비 검사는 로컬 HTTP/폰트/MIME/읽기전용 API/경로·메서드 가드/원본 바이트/독립 build/운영설정 분리를 통과했다. 브라우저·실기기·Windows 설치 파일 검증은 별도다. blob 업로드와 main 커밋 연결은 구분하며 최종 상태는 HANDOFF.md를 읽는다.

공개 전환·일괄 오픈소스 라이선스 부여·기존 사이트 재배포는 하지 않는다. Windows 다음 단계는 windows-desktop-plan.md 참조.
