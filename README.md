# 말풍선 공방

한국어 만화·웹툰의 말풍선, 대사, 컷과 게임/SNS 서식을 편집하는 웹 도구입니다.

## 로컬 실행

Node.js 22 이상에서 다음 명령을 실행하고 표시된 주소를 여세요. 기본 실행에는 패키지 설치가 필요 없습니다.

```sh
node scripts/dev-local.mjs
```

또는 `npm run dev`. 소스: `public/`, 빌드: `npm run build`. 프로젝트 파일/PNG 저장과 브라우저 자동저장을 사용합니다. 다른 브라우저나 기존 서비스의 작업은 자동 이전되지 않으므로 프로젝트 파일로 내보낸 뒤 가져오세요.

## Windows 개발·설치 파일 빌드

Node.js와 npm을 설치한 개발 환경에서 npm install 후 npm run desktop으로 실행합니다. npm run desktop:installer는 release/에 NSIS 설치 파일과 blockmap을 만듭니다. 일반 사용자는 설치 파일만 실행하면 되며 Node.js를 별도로 설치할 필요가 없습니다.

검사: npm run test:desktop, node tests/desktop-client.cjs, node tests/desktop-shell.cjs, node tests/desktop-package.cjs. 실제 두 버전 EXE/블록맵을 준비한 뒤 node tests/desktop-differential.cjs로 변경분 다운로드·전체 다운로드 선택을 검증합니다.

## 이 저장소의 상태

- Windows0.1.1 NSIS 설치형과 로컬 프로젝트 파일 저장을 구현했습니다. 업데이트는 실행당1회 확인·클릭 시 차등 다운로드·저장 후 설치 방식입니다. 실제 EXE 차등 다운로드와 설치·기동 검증을 마쳤습니다. 운영 업데이트 배포 주소와 코드 서명은 아직 연결하지 않았습니다. 자세한 검증 범위는 HANDOFF.md를 읽으세요.
- 기존 서비스의 Git 이력, 배포 식별자 설정, 운영자 이메일과 서버 DB/스토리지는 이전하지 않습니다. 원래 사이트 운영과 별도입니다.
- 로컬 공용 에셋 목록은 비어 있고 방문 통계 수집은 하지 않습니다. 포함된 서식과 내 에셋·폰트 가져오기는 로컬 기능입니다.
- `worker/index.js`의 관리자 쓰기는 기본 비활성입니다. 별도 서버 배포 전 인증과 저장소를 구성해야 합니다.

## 검증

`node scripts/verify-snapshot.mjs`로 전체 소스·폰트·에셋의 SHA256을 확인할 수 있습니다. 기본 포트 4173이 사용 중이면 PowerShell에서 `$env:PORT=4185; node scripts/dev-local.mjs`로 다른 포트를 선택하세요. Windows 설치형 다음 단계는 `docs/windows-desktop-plan.md`를 참조하세요.

`npm run build`는 배포 HTML/JS/Worker 일치를 검사합니다. 기존 Canvas 테스트에는 `@napi-rs/canvas`가 추가로 필요합니다. 브라우저·실기기와 Windows 설치형 검증은 별개입니다.

## 서체·에셋

현재는 비공개 소스 보관을 전제로 준비했습니다. 원본 라이선스와 출처는 `public/fonts/`, `docs/fonts/`, `docs/assets/`에 보존합니다. 이 프로젝트 전체에 MIT 같은 오픈소스 라이선스를 일괄 부여하지 않았습니다. 제3자 폰트·이미지의 공개 재배포 범위는 별도로 확인해야 합니다.
