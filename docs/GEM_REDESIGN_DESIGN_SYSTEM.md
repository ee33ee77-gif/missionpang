# MISSIONPANG — PREMIUM GAME VISUAL REDESIGN v1.0
## 게임 아트 디렉션 · 디자인 시스템 · 에셋 제작 명세

- **대상 저장소**: `bhr0131-ux/missionpang` (작업 브랜치: `design/gem-adventure-redesign-v1`)
- **공식 아트 디렉션**: **Premium Cozy Fantasy / Magical Gem Adventure / 2.5D Stylized Game Art**
- **호환 원칙**: 기존 `v6_*` 저장 키, 부모/아이 흐름, `tokens.js`·`characters.js`·`gameData.jsx` 데이터 구조를 보존하고, 신규 보석 그래픽 토큰은 `src/data/gemDesignTokens.js`, 보석 카탈로그는 `src/data/gemCatalog.js`에 분리 관리한다.

---

## 1. 디자인 시스템 (Design System)

### 1.1 색상 팔레트 (Color Palette)
기존 `src/data/tokens.js`의 `DUNGEON_BASE(#1D3056)` 저녁하늘 톤을 계승하되, **따뜻한 황금 광원 + 깊은 마법 숲/성소 네이비** 대비로 게임 몰입감과 한국어 가독성을 동시에 확보한다.

| 역할 | 토큰명 | HEX / RGBA | 사용처 |
| :--- | :--- | :--- | :--- |
| 배경 최하단 | `bgAbyss` | `#121A30` | 화면 하단·모달 딤 배경 |
| 배경 트와일라잇 | `bgTwilight` | `#1A2746` | 기본 카드·패널 베이스 |
| 표면 패널 | `surfacePanel` | `rgba(26, 39, 70, 0.84)` | 배경 일러스트 위 반투명 2.5D 패널 |
| 주 텍스트 | `textPrimary` | `#FFFDF7` | 제목·미션명·수치 (따뜻한 크림 화이트) |
| 보조 텍스트 | `textSecondary` | `#CFD8EE` | 학원명·시간·설명 |
| 골드 강조 | `goldMain` / `goldLight` | `#F5C451` / `#FFE89E` | 주요 CTA 버튼·레벨·보석 카운트 |
| 완료 상태 | `success` | `#4CE0A8` | 미션 완료·승인 배지 |
| 대기 상태 | `pending` | `#F9C74F` | 엄마 확인 대기 상태 |

### 1.2 표면·보석 재질 및 조명 기준
- **광원 방향**: 모든 일러스트·보석·UI 패널은 **좌상단 315° 방향**에서 내려오는 따뜻한 주광(금빛/햇살)과 우하단 청보라 반사광으로 통일한다.
- **UI 패널 재질**: 단순 평면 단색이나 과한 네온 대신 **유리·석판 혼합 반투명 레이어**(`backdrop-filter: blur(10px)` + 상단 `1px` 내부 하이라이트 `inset 0 1px 0 rgba(255,255,255,0.14)` + 부드러운 낙하 그림자).
- **보석 재질**: 2.5D 핸드페인팅 스타일의 반투명 수정·유리 질감, 선명한 패싯(면) 경계, 내부 발광 코어, 좌상단 스페큘러 하이라이트.

### 1.3 캐릭터 비율 및 기존 자산 계승
- 기존 `public/assets/growth-characters/adventure/{boy|girl}/stage-1~5.webp`의 **2.2~2.5등신 SD 탐험가 비율**을 그대로 유지한다.
- 캐릭터 발밑에 부드러운 접지 그림자(`radial-gradient`)와 은은한 반딧불이/보석 반사광을 더해 새 배경(`bg-gem-forest.webp`)과 자연스럽게 합성한다.

### 1.4 모서리 곡률 · 버튼 · 터치 영역 · 한국어 타이포그래피
- **모서리 곡률**: 소형 칩 `12px`, 미션 카드 `16px`, 메인 패널 `22px`, 보석 획득 모달 `28px`, 배지/탭 `999px`.
- **입체 게임 버튼**: 하단 4px 베벨 그림자(`box-shadow: 0 4px 0 #915C0C`)와 눌림(`translateY(2px)`) 피드백을 적용해 모바일 게임의 손맛을 제공한다.
- **모바일 터치 & 레이아웃**: 갤럭시 세로 화면(`360~412px` 폭, `9:16`~`9:19.5`) 기준, 모든 주요 버튼은 최소 `48px × 48px` 터치 영역과 `12~16px` 간격을 보장한다.
- **한국어 타이포그래피**: `Pretendard` / `Noto Sans KR` 기준, 제목 `22px(800)` / 섹션 `16px(800)` / 미션 카드 `15px(700)` / 본문 `13px(500)`, 숫자는 `tabular-nums`로 흔들림을 방지한다.

### 1.5 희귀도별 보석 구분 (Rarity Hierarchy)
| 등급 | 한글명 | 테두리색 | 오라·입자 색 | 시각적 차별화 |
| :--- | :---: | :--- | :--- | :--- |
| `common` | 일반 | `#A8C5E8` | 부드러운 하늘·크림 | 은은한 정적 광택 |
| `rare` | 희귀 | `#63B8FF` | 아쿠아·별빛 블루 | 완만한 빛 띠 스윕 |
| `epic` | 영웅 | `#C495FF` | 라벤더·로즈 핑크 | 이중 오라 + 반짝임 입자 |
| `legendary` | 전설 | `#FFD56B` | 황금·무지개 프리즘 | 회전 빛줄기(God Rays) + 멀티 스파클 |

### 1.6 보상 애니메이션 규칙 및 접근성
- **미션 완료 → 보석 획득 7단계 시퀀스**:
  1. 조건·중복 지급 검사 (`rewardedMissionIds` 멱등성 체크 — 연타/재진입 차단)
  2. 화면 중앙 보석 등장 (`520ms` 스프링 팝인 + 희귀도 빛줄기)
  3. 보석 광택·입체감 강조 (대각선 빛 띠 스윕 + 부드러운 부유)
  4. 짧고 절제된 입자 버스트 (희귀도별 6~10개 스파클, 과도한 섬광 금지)
  5. 획득 메시지·보석 이야기·도감 등록 배지 표시
  6. `[보석함에 넣기]` 탭 시 상단 보석함/도감 슬롯으로 곡선 비행 이동 (`680ms`)
  7. 도감 슬롯 상태 갱신 및 카운트 증가
- **접근성 & 저사양 대응**:
  - `@media (prefers-reduced-motion: reduce)` 또는 앱 내 **저사양/모션 축소 토글** 활성화 시 회전·입자·비행 애니메이션을 즉시 생략하고 정적 전환으로 모든 기능을 100% 동일하게 사용할 수 있다.

---

## 2. 1차 실제 제작 그래픽 에셋 목록 (완료)

이미지 생성 도구로 실제 제작 후 `public/assets/`에 WebP 최적화 저장 완료(`CLAUDE.md` base64 금지 원칙 준수).

| 분류 | 파일 경로 | 해상도 | 용량 | 용도 |
| :--- | :--- | :---: | :---: | :--- |
| 배경 | `public/assets/backgrounds/bg-gem-forest.webp` | 714×1280 | 147 KB | 메인 모험 화면(시안 A·C) 배경 |
| 배경 | `public/assets/backgrounds/bg-gem-vault.webp` | 714×1280 | 113 KB | 보석 도감(시안 B)·획득 연출 배경 |
| 보석(일반) | `public/assets/gems/quartz.webp` | 384×384 | 17 KB | 햇살 석영 (육각 기둥 결정) |
| 보석(일반) | `public/assets/gems/emerald.webp` | 384×384 | 20 KB | 숲의 에메랄드 (팔각 스텝 컷) |
| 보석(희귀) | `public/assets/gems/sapphire.webp` | 384×384 | 12 KB | 하늘 사파이어 (물방울 페어 컷) |
| 보석(희귀) | `public/assets/gems/amethyst.webp` | 384×384 | 21 KB | 별빛 자수정 (자수정 군집) |
| 보석(영웅) | `public/assets/gems/ruby.webp` | 384×384 | 10 KB | 불꽃 루비 (쿠션 오벌 컷) |
| 보석(전설) | `public/assets/gems/diamond.webp` | 384×384 | 15 KB | 천공 다이아몬드 (로열 브릴리언트) |
| 캐릭터(기존) | `public/assets/growth-characters/adventure/boy/stage-3.webp` | 기존 유지 | 기존 유지 | Lv.7 탐험가 캐릭터 (시안 A·C 합성) |

### 검수 기준
- 모든 에셋에 텍스트·워터마크·UI 프레임이 없다.
- 6종 보석 모두 좌상단 주광, 일관된 2.5D 핸드페인팅 질감, 40px 축소 시에도 실루엣과 색상이 즉시 구분된다.
- 미획득 상태는 CSS 실루엣(`filter: brightness(0.18) saturate(0.2) opacity(0.55)`)으로 별도 이미지 없이 경량 처리한다.
