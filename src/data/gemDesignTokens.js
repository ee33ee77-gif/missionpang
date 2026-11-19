// MISSIONPANG — PREMIUM GAME VISUAL REDESIGN v1.0
// 디자인 시스템 토큰 (기존 src/data/tokens.js의 모험 팔레트·등급 체계와 호환)

export const GEM_DESIGN_TOKENS = {
  artDirection: {
    name: "Premium Cozy Fantasy / Magical Gem Adventure / 2.5D Stylized Game Art",
    lightSource: "Top-Left 315deg (따뜻한 황금 햇빛 / 촛불 주광 + 청보라 반사광)",
    characterRatio: "2.2~2.5등신 SD 탐험가 (기존 growth-characters 1~5단계 그대로 계승)",
  },

  colors: {
    // 밤하늘·숲·성소 베이스 (기존 DUNGEON_BASE #1D3056 계열을 따뜻하고 깊게 정제)
    bgAbyss: "#121A30",
    bgTwilight: "#1A2746",
    bgForestDeep: "#18302E",
    surfacePanel: "rgba(26, 39, 70, 0.84)",
    surfacePanelSolid: "#1E2D52",
    surfaceCard: "rgba(38, 55, 94, 0.78)",
    surfaceElevated: "rgba(49, 70, 118, 0.88)",

    // 따뜻한 크림·골드 강조 (아이 눈의 피로를 줄이는 고대비 텍스트)
    textPrimary: "#FFFDF7",
    textSecondary: "#CFD8EE",
    textMuted: "#95A4C8",
    goldLight: "#FFE89E",
    goldMain: "#F5C451",
    goldDeep: "#C5891C",

    // 시맨틱 상태
    success: "#4CE0A8",
    successDeep: "#1B8F67",
    pending: "#F9C74F",
    danger: "#FF6B8B",
    borderSoft: "rgba(218, 232, 255, 0.18)",
    borderGold: "rgba(245, 196, 81, 0.55)",
  },

  rarity: {
    common: {
      id: "common",
      label: "일반",
      color: "#A8C5E8",
      border: "rgba(168, 197, 232, 0.65)",
      bg: "linear-gradient(160deg, rgba(46,66,108,0.92), rgba(29,44,76,0.96))",
      glow: "rgba(168, 197, 232, 0.35)",
      particles: ["#E4F1FF", "#A8C5E8", "#FFE89E"],
    },
    rare: {
      id: "rare",
      label: "희귀",
      color: "#63B8FF",
      border: "rgba(99, 184, 255, 0.78)",
      bg: "linear-gradient(160deg, rgba(35,74,128,0.92), rgba(24,47,89,0.96))",
      glow: "rgba(99, 184, 255, 0.48)",
      particles: ["#BAE6FF", "#63B8FF", "#93F5FF"],
    },
    epic: {
      id: "epic",
      label: "영웅",
      color: "#C495FF",
      border: "rgba(196, 149, 255, 0.85)",
      bg: "linear-gradient(160deg, rgba(77,50,126,0.92), rgba(40,28,74,0.96))",
      glow: "rgba(196, 149, 255, 0.52)",
      particles: ["#F0DBFF", "#C495FF", "#FF8FAB"],
    },
    legendary: {
      id: "legendary",
      label: "전설",
      color: "#FFD56B",
      border: "rgba(255, 213, 107, 0.92)",
      bg: "linear-gradient(155deg, rgba(114,82,36,0.94), rgba(62,42,88,0.96))",
      glow: "rgba(255, 213, 107, 0.62)",
      particles: ["#FFF6CC", "#FFD56B", "#9EEFFF", "#E0B3FF"],
    },
  },

  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    touchMin: 48, // 초등학생 손가락 터치 최소 영역 (48px)
  },

  typography: {
    fontFamily: "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    heroTitle: { size: 22, weight: 800, lineHeight: 1.25 },
    sectionTitle: { size: 16, weight: 800, lineHeight: 1.3 },
    cardTitle: { size: 15, weight: 700, lineHeight: 1.35 },
    body: { size: 13, weight: 500, lineHeight: 1.45 },
    caption: { size: 11, weight: 600, lineHeight: 1.3 },
    numeric: { fontVariantNumeric: "tabular-nums" },
  },

  shadows: {
    panel: "0 12px 28px rgba(8, 14, 30, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
    button3d: "0 4px 0 rgba(145, 92, 12, 0.85), 0 8px 18px rgba(10, 16, 36, 0.36)",
    gemFloat: "0 10px 22px rgba(6, 12, 28, 0.48)",
  },

  motion: {
    popMs: 520,
    shimmerMs: 1100,
    flyMs: 680,
    springEasing: "cubic-bezier(0.22, 1.35, 0.36, 1)",
    smoothEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
};
