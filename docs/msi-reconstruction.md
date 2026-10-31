# Windows MSI 0.3.4 빌드 복원

2026-11-01. GitHub main의 0.1.1, 설치된 0.3.3, Sites v260을 합쳐 독립 MSI 빌드를 복원했다. 예전 노트북의 빌드 폴더는 사용하지 않았다. 기존 Sites 호스팅·서버 설정은 가져오지 않는다.

## 빌드

Windows x64, Node.js 22 이상과 npm이 필요하다. 이번 검증은 Node.js 24.22.1에서 진행했다.

```powershell
npm ci
npm run desktop:installer
```

출력은 `release/Balloon-Studio-Setup-0.3.4-x64.msi`, `.msi.blockmap`, `latest-msi.json`, `SHA256SUMS.txt`이다. 기존 0.3.3에 대한 차등 메타데이터도 만들려면 검증된 MSI를 지정한다.

```powershell
npm run desktop:installer -- --base-msi "C:\path\Balloon-Studio-Setup-0.3.3-x64.msi"
```

일반 빌드에서는 WiX ICE 검사가 활성화된다. 이번 호스트는 LGHT1105(시스템 정책으로 ICE 검사 불가)를 반환했다. 관리자 권한이나 시스템 정책을 변경하지 않고 다음 명시적 옵션으로만 ICE를 제외했다.

```powershell
npm run desktop:installer -- --skip-ice-validation --base-msi "C:\path\Balloon-Studio-Setup-0.3.3-x64.msi"
```

`--prepackaged`는 현재 소스와 이미 일치하는 `release/win-unpacked`를 재사용할 때만 쓴다. `--metadata-only`는 이미 만든 MSI의 블록맵·해시·피드만 다시 만들며 MSI를 빌드하지 않는다.

## 유지한 설치 계약

- UpgradeCode `5A79FDF4-583C-41C0-B75B-8A01887417A6`, 사용자별 `%LOCALAPPDATA%\Programs\BalloonStudioMSI` 설치, 한국어 MSI(1042).
- 기존 588개 파일 구성요소 GUID와 HKCU 키 경로. 새 7개 기능 파일은 제품군·경로에 따른 고정 GUID를 사용한다.
- HKCU `Software\BalloonStudio\MSI\InstallLocation`에서 기존 설치 위치를 찾아 이어간다.
- RemoveExistingProducts는 InstallInitialize 직후(1501)다. Windows Installer의 트랜잭션 안에서 기존 버전을 교체한다.
- 앱의 사용자 데이터는 `%APPDATA%\BalloonStudio`와 `studio://app` origin을 유지한다. 설치 프로그램은 이 데이터 폴더를 삭제하지 않는다.
- 실행당 시작 시 업데이트 확인 한 번, 오프라인 무알림, 클릭 시 차등 다운로드, 전체 다운로드는 별도 선택, 저장·복구 성공 후 설치 정책을 유지한다.

`build/msi-0.3.3-identities.json`은 검증된 0.3.3 MSI 테이블에서 읽은 경로/GUID 목록이다. `scripts/msi-project.cjs`가 고정된 electron-builder 26.18.0의 파일 목록으로 WiX 프로젝트를 생성한다. Electron 45.0.0, electron-updater 6.8.11을 유지했다.

## 사이트와의 병합

Sites v260(4f723130)의 썬·문 본문 여백, 프로젝트 메모리·자동저장 두 세대/복구, 전체 장 PNG ZIP, 검열 25종·편집·필터 범위를 반영했다. 설치형의 림버스, 25개 오프라인 브러시 팁, 공통 입력/사진/게임 출력 함수, 네이티브 저장·MSI 업데이트 코드를 보존했다. 운영 호스팅 설정·관리자 권한·DB/스토리지는 합치지 않았다.

## 검증

```powershell
npm run test:desktop
npm run test:msi
node scripts/check-editor-audit.cjs
node tests/project-memory-recovery.cjs
node tests/censor-assets.cjs
node tests/censor-signs.cjs
node tests/limbus-ui.cjs
node tests/pokemon-sunmoon.cjs
node tests/brushes.cjs
node tests/builtin-brushes.cjs
node tests/desktop-package.cjs
node tests/msi-differential.cjs
```

`tests/batch-export.cjs`는 별도 Python 3의 zipfile로 CRC·한글 파일명·PNG 바이트를 교차 검증한다. `PYTHON` 환경 변수로 Python 실행 파일을 지정할 수 있다. QA 그림은 체크아웃의 `work/qa`에 저장하며 과거 Linux `/tmp`와 scratch 경로에 의존하지 않는다. `tests/editor-input-performance.cjs`의 과거 Git 비교는 `BALLOON_LEGACY_LAYER_REF`를 지정할 때만 실행하며 현재 동작의 검사는 항상 실행한다.

패키지의 실제 ASAR를 Electron에서 시험하려면 다음을 실행한다. 사용자 데이터와 저장 대화상자는 시험 폴더로 격리된다.

```powershell
npx electron tests/electron-smoke.cjs
```

이번 결과:

- 편집기 종합 24/24, 메모리/두 세대 복구, 림버스, 포켓몬 3종, 검열, 실제 30장 PNG ZIP/Python CRC, 입력·자동저장·브러시 검사를 통과했다.
- 실제 Electron에서 오류 없이 로드, 네이티브 JSON 저장, 실제 IndexedDB 저장, PNG와 ZIP 다운로드를 확인했다. 대화상자는 시험 경로로 지정한 자동 통합 검사이며 사람의 창 조작 전수 검사는 아니다.
- 생성된 MSI의 한국어/제품/설치 경로/588개 GUID/트랜잭션 순서를 검사했다. `/a`로 작업 폴더에만 소스 이미지를 추출해 595개 전체 파일이 unpacked 출력과 일치함을 확인했다. 실제 설치·업그레이드는 하지 않았다.
- 실제 0.3.3→0.3.4 MSI 차등 재구성은 최종 SHA256이 일치했다. 267,537,232바이트 중 263,668,980바이트를 266회 Range로 전송해 1.45% 절감했다. 이번에는 패키징 재구성으로 압축 스트림 대부분이 달라져 절감 폭이 작다. 메타데이터/블록맵 전송량은 제외한다.
- 기준 MSI가 없는 경우 자동 전체 다운로드를 하지 않고 사용자 선택을 요구하는 경로도 검증했다. Node 시험 transport에서 Socket timeout listener 경고는 발생했지만 바이트·해시 검사는 통과했다.

## 남은 범위

실제 0.3.3 설치본에 대한 0.3.4 업그레이드·재시작·복구·제거/롤백은 미실시다. 현재 PC의 설치본은 0.3.3이며 기존 편집기 516파일의 SHA256이 그대로임을 확인했다. ICE는 호스트 정책으로 제외했으므로 가능한 Windows 환경에서 기본 설정으로 재검증해야 한다. 운영 업데이트 URL은 null, 코드 서명도 미설정이다. 자동 업데이트 서버나 사이트 배포를 완료한 것으로 해석하지 않는다.

설치 제품군의 UpgradeCode와 실제 설치를 구분하는 근거: [electron-builder MSI 문서](https://www.electron.build/docs/msi/), [Microsoft의 administrative installation 설명](https://learn.microsoft.com/en-us/windows/win32/msi/administrative-installation).
