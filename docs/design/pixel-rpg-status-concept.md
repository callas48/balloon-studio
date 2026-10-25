# 도트 RPG 상태창 첫 시안

- 산출물: pixel-rpg-status-concept.png (built-in imagegen 제작).
- 참고: 사용자 첨부186223295.zip의 UI 프레임과 HP/탄약 구성. 캐릭터/장면은 제외한 독립 UI 컨셉.
- 사용자가 확정한 구현 구조: 0~99% 공통 질감을 아래부터 마스크로 노출. 0% 채움 없음. 100% 별도 그래픽. 수치는 캔버스 드래그와 입력 연동.
- 사용자가 시안을 승인하여100% 결정 코어를 포함해 구현함.
- 구현: `public/pixel-rpg.js`, 런타임 atlas: `public/pixel-rpg/atlas.png`. 하단 상태 기본 이름은 사용자 요청에 맞춰 청렴도이며 변경 가능.

## 생성 프롬프트 요지
Use case: ui-mockup. Pixel-art fantasy RPG status gauge concept sheet on charcoal background. Four identical ornate gold frames with cyan jewels, titles 타락률 and 청렴성; columns 0/50/99/100 percent and complementary lower values 100/50/1/0. HP bar and AMMO11 header. Empty black-plum well at zero. One fixed oxblood/aubergine cloudy texture revealed only at the bottom half for 50%, almost completely at 99%. Thin magenta surface line. Separate dark garnet crystal core for100%, same frame. Crisp16-bit clustered pixel edges, readable labels, no characters, no logos.

## 채움 높이 보정
Preserve all frames, typography, labels, colors and separate100% crystal. Change only reveal levels in50%/99%: a well approximately y260–814 has50% surface at537 and99% surface at266, with a thin1% empty top gap. Match lower texture landmarks as a common fixed full-height artwork masked from the top rather than scaled.

## 한계
생성 일러스트는 시각 검토용이며 실제 수치·마스크·레이아웃 일치는 구현 단계에서 Canvas로 정확히 계산해야 한다. 실제 수치/마스크는 구현된 공통 Canvas 렌더에서 계산. 드래그·저장·출력 경로 구현과 native Canvas 검사 완료, 실제 기기 검증은 별도 필요.
