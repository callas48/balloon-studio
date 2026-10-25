// Export a clean initial snapshot; never copies .git history or Sites identity.
import {execFileSync} from 'node:child_process';
import {cpSync,existsSync,lstatSync,mkdirSync,readFileSync,writeFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=process.argv[2];if(!destination)throw Error('Usage: node scripts/prepare-github.mjs /absolute/empty-destination');
const out=path.resolve(destination);if(out===root||out.startsWith(root+path.sep))throw Error('Destination must be outside the source repository');
if(existsSync(out))throw Error('Destination already exists; choose a new directory');
const names=execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean);
const excluded=n=>n==='GITHUB-SNAPSHOT.json'||n.startsWith('.openai/')||n.startsWith('.sites-runtime/')||n.startsWith('dist/')||n.split('/').some(p=>p.startsWith('.')&&p!=='.gitignore');
const included=names.filter(n=>!excluded(n));
for(const n of included){const p=path.join(root,n);if(!lstatSync(p).isFile()||realpathSync(p)!==p)throw Error('Only regular tracked source files are exported: '+n)}
mkdirSync(out,{recursive:true});for(const n of included){const p=path.join(out,n);mkdirSync(path.dirname(p),{recursive:true});cpSync(path.join(root,n),p)}
const read=n=>readFileSync(path.join(out,n),'utf8'),write=(n,s)=>writeFileSync(path.join(out,n),s);
// A portable web build does not require the original hosting manifest.
let portableBuild=read('scripts/build.mjs');
if(!portableBuild.includes('existsSync'))portableBuild=portableBuild.replace('cpSync,mkdirSync,writeFileSync,readFileSync,rmSync','cpSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync');
if(!portableBuild.includes("if(existsSync('.openai/hosting.json'))"))portableBuild=portableBuild.replace("mkdirSync('dist/.openai',{recursive:true});cpSync('.openai/hosting.json','dist/.openai/hosting.json');","if(existsSync('.openai/hosting.json')){mkdirSync('dist/.openai',{recursive:true});cpSync('.openai/hosting.json','dist/.openai/hosting.json')};");
write('scripts/build.mjs',portableBuild);
// Do not migrate the original account's admin allowlist or imply portable auth.
write('worker/index.js',read('worker/index.js').replace(/const assetOwnerEmail=.*?;\nconst isAssetOwner=.*?;\n/,'// Server admin writes remain disabled until a trusted authentication adapter is configured.\nconst isAssetOwner=()=>false;\n'));
const pkg=JSON.parse(read('package.json'));pkg.scripts.dev='node scripts/dev-local.mjs';write('package.json',JSON.stringify(pkg,null,2)+'\n');
write('.gitignore',read('.gitignore')+'\n.openai/\n.env\n.env.*\n!.env.example\nrelease/\n*.log\n');
write('README.md',`# 말풍선 공방\n\n한국어 만화·웹툰의 말풍선, 대사, 컷과 게임/SNS 서식을 편집하는 웹 도구입니다.\n\n## 로컬 실행\n\nNode.js 22 이상에서 다음 명령을 실행하고 표시된 주소를 여세요. 기본 실행에는 패키지 설치가 필요 없습니다.\n\n\x60\x60\x60sh\nnode scripts/dev-local.mjs\n\x60\x60\x60\n\n또는 \x60npm run dev\x60. 소스: \x60public/\x60, 빌드: \x60npm run build\x60. 프로젝트 파일/PNG 저장과 브라우저 자동저장을 사용합니다. 다른 브라우저나 기존 서비스의 작업은 자동 이전되지 않으므로 프로젝트 파일로 내보낸 뒤 가져오세요.\n\n## 이 저장소의 상태\n\n- Windows 설치형으로 전환하기 전의 웹 편집기 초기 소스입니다. 설치 파일·자동 업데이트·네이티브 파일 자동저장은 아직 없습니다.\n- 기존 서비스의 Git 이력, 배포 식별자 설정, 운영자 이메일과 서버 DB/스토리지는 이전하지 않습니다. 원래 사이트 운영과 별도입니다.\n- 로컬 공용 에셋 목록은 비어 있고 방문 통계 수집은 하지 않습니다. 포함된 서식과 내 에셋·폰트 가져오기는 로컬 기능입니다.\n- \x60worker/index.js\x60의 관리자 쓰기는 기본 비활성입니다. 별도 서버 배포 전 인증과 저장소를 구성해야 합니다.\n\n## 검증\n\n\x60npm run build\x60는 배포 HTML/JS/Worker 일치를 검사합니다. 기존 Canvas 테스트에는 \x60@napi-rs/canvas\x60가 추가로 필요합니다. 브라우저·실기기와 Windows 설치형 검증은 별개입니다.\n\n## 서체·에셋\n\n현재는 비공개 소스 보관을 전제로 준비했습니다. 원본 라이선스와 출처는 \x60public/fonts/\x60, \x60docs/fonts/\x60, \x60docs/assets/\x60에 보존합니다. 이 프로젝트 전체에 MIT 같은 오픈소스 라이선스를 일괄 부여하지 않았습니다. 제3자 폰트·이미지의 공개 재배포 범위는 별도로 확인해야 합니다.\n`);
write('AGENTS.md',`# 말풍선 공방 — GitHub 작업 규칙\n\n- 시작 시 HANDOFF.md와 README.md를 읽고 사용자 지시를 우선한다.\n- 편집기 원본은 public/, 서버 예시는 worker/, 빌드는 scripts/build.mjs. dist/는 생성물이다.\n- 기존 사용자 문서/폰트ID/에셋번호/Undo·저장·썸네일·출력·PC와 모바일 제스처를 보존한다.\n- 기능별 tests/를 선택해 실행하고 Canvas 검증과 실제 기기 확인을 구분한다.\n- 이 저장소는 기존 Sites 운영 저장소와 별도다. 기존 서비스에 자동 배포하거나 과거 배포ID를 재사용하지 않는다.\n- 명시적 사용자 요청 없이 다른 에이전트에 위임하지 않는다.\n- 종료 시 HANDOFF.md와 CHANGELOG.md에 결과 및 미완료/검증 한계를 기록한다.\n`);
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const manifest={sourceCommit,repository:'callas48/balloon-studio',visibility:'private',preparedAt:new Date().toISOString(),excluded:names.filter(excluded),files:[]};
const finalNames=[...new Set([...included,'README.md'])].sort();
for(const n of finalNames){const data=readFileSync(path.join(out,n));manifest.files.push({path:n,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')})}
write('GITHUB-SNAPSHOT.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({directory:out,sourceCommit,files:manifest.files.length,bytes:manifest.files.reduce((a,f)=>a+f.bytes,0),excluded:manifest.excluded.length}));
