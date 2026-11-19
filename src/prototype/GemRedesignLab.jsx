import React, { useMemo, useRef, useState } from "react";
import { GEM_BACKGROUNDS, GEM_CATALOG, PROTOTYPE_SAMPLE_STATE } from "../data/gemCatalog.js";
import { GEM_DESIGN_TOKENS } from "../data/gemDesignTokens.js";
import "./gemRedesign.css";

const CONCEPTS = [
  {
    id: "A",
    name: "시안 A · Fantasy Adventure",
    short: "시안 A (모험 숲)",
    bg: GEM_BACKGROUNDS.forest,
    scrim: "forest",
    summary: "마법의 숲과 탐험 캐릭터를 화면 상단 절반 이상 크게 배치해, 매일 미션을 모험의 여정으로 느끼게 하는 구도.",
  },
  {
    id: "B",
    name: "시안 B · Gem Collection",
    short: "시안 B (보석 도감)",
    bg: GEM_BACKGROUNDS.vault,
    scrim: "vault",
    summary: "보석 성소 배경 위에 6종 보석 도감 슬롯을 전면 배치해 수집 욕구와 희귀도 광택을 극대화하는 구도.",
  },
  {
    id: "C",
    name: "시안 C · Character & Adventure (추천)",
    short: "시안 C (추천 · 균형형)",
    bg: GEM_BACKGROUNDS.forest,
    scrim: "forest",
    summary: "기존 성장 캐릭터·레벨·XP와 신규 보석 수집·오늘의 미션을 한눈에 연결하는 최적 밸런스 구도.",
  },
];

const SPARKLES = [
  { tx: "-74px", ty: "-68px", delay: "0.05s" },
  { tx: "78px", ty: "-62px", delay: "0.10s" },
  { tx: "-86px", ty: "12px", delay: "0.14s" },
  { tx: "88px", ty: "18px", delay: "0.08s" },
  { tx: "-48px", ty: "76px", delay: "0.18s" },
  { tx: "56px", ty: "74px", delay: "0.12s" },
  { tx: "0px", ty: "-92px", delay: "0.04s" },
  { tx: "0px", ty: "88px", delay: "0.16s" },
];

export default function GemRedesignLab() {
  const [conceptId, setConceptId] = useState("C");
  const [reducedMotion, setReducedMotion] = useState(false);

  // 프로토타입 전용 독립 상태 (기존 v6_* localStorage 절대 미사용)
  const [missions, setMissions] = useState(() => PROTOTYPE_SAMPLE_STATE.missions);
  const [collected, setCollected] = useState(() => [...PROTOTYPE_SAMPLE_STATE.collectedGemIds]);
  const [xp, setXp] = useState(PROTOTYPE_SAMPLE_STATE.child.xp);
  const [coins, setCoins] = useState(PROTOTYPE_SAMPLE_STATE.child.coins);
  const [selectedGemId, setSelectedGemId] = useState("gem_ruby");

  // 7단계 보석 획득 연출 상태 + 중복 지급 방지 락
  const rewardedMissionIdsRef = useRef(new Set(["m_piano"]));
  const [revealState, setRevealState] = useState(null); // { mission, gem, phase: 'show' | 'flying' }
  const [vaultPulse, setVaultPulse] = useState(false);

  const concept = CONCEPTS.find((c) => c.id === conceptId) || CONCEPTS[2];
  const gemById = useMemo(() => Object.fromEntries(GEM_CATALOG.map((g) => [g.id, g])), []);
  const selectedGem = gemById[selectedGemId] || GEM_CATALOG[0];

  const doneCount = missions.filter((m) => m.status === "approved").length;
  const xpPercent = Math.min(
    100,
    Math.round(((xp - PROTOTYPE_SAMPLE_STATE.child.prevLevelXp) / (PROTOTYPE_SAMPLE_STATE.child.nextLevelXp - PROTOTYPE_SAMPLE_STATE.child.prevLevelXp)) * 100)
  );
  const nextLockedGem = GEM_CATALOG.find((g) => !collected.includes(g.id)) || GEM_CATALOG[GEM_CATALOG.length - 1];

  const handleCompleteMission = (mission) => {
    // 1단계: 조건 확인 및 연타/중복 지급 차단
    if (mission.status === "approved" || revealState || rewardedMissionIdsRef.current.has(mission.id)) {
      return;
    }
    rewardedMissionIdsRef.current.add(mission.id);
    const gem = gemById[mission.rewardGemId] || GEM_CATALOG[0];
    setMissions((prev) => prev.map((m) => (m.id === mission.id ? { ...m, status: "approved" } : m)));
    setRevealState({ mission, gem, phase: "show" });
  };

  const handleCollectToVault = () => {
    if (!revealState || revealState.phase === "flying") return;
    const { mission, gem } = revealState;

    const finalize = () => {
      setXp((v) => v + mission.rewardXp);
      setCoins((v) => v + mission.rewardCoin);
      setCollected((prev) => (prev.includes(gem.id) ? prev : [...prev, gem.id]));
      setSelectedGemId(gem.id);
      setRevealState(null);
      setVaultPulse(true);
      setTimeout(() => setVaultPulse(false), 520);
    };

    if (reducedMotion) {
      finalize();
      return;
    }

    // 6단계: 보석 보관함으로 이동 연출 후 7단계 상태 갱신
    setRevealState((prev) => (prev ? { ...prev, phase: "flying" } : null));
    setTimeout(finalize, GEM_DESIGN_TOKENS.motion.flyMs);
  };

  const handleResetDemo = () => {
    rewardedMissionIdsRef.current = new Set(["m_piano"]);
    setMissions(PROTOTYPE_SAMPLE_STATE.missions);
    setCollected([...PROTOTYPE_SAMPLE_STATE.collectedGemIds]);
    setXp(PROTOTYPE_SAMPLE_STATE.child.xp);
    setCoins(PROTOTYPE_SAMPLE_STATE.child.coins);
    setSelectedGemId("gem_ruby");
    setRevealState(null);
  };

  const rarityInfo = (r) => GEM_DESIGN_TOKENS.rarity[r] || GEM_DESIGN_TOKENS.rarity.common;

  return (
    <div className={`mp-lab ${reducedMotion ? "mp-reduced" : ""}`}>
      <header className="mp-lab-header">
        <div className="mp-lab-title">
          <h1>💎 미션팡 — PREMIUM GAME VISUAL REDESIGN v1.0 프로토타입</h1>
          <p>동일 샘플 데이터(유찬 · Lv.7 · 미션 3개 · 보석 6종)로 시안 A/B/C 비교 및 보석 획득 7단계 연출 체험</p>
        </div>
        <div className="mp-lab-controls">
          {CONCEPTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`mp-pill-btn ${conceptId === c.id ? "active" : ""}`}
              onClick={() => setConceptId(c.id)}
            >
              {c.short}
            </button>
          ))}
          <button
            type="button"
            className={`mp-pill-btn ${reducedMotion ? "active" : ""}`}
            onClick={() => setReducedMotion((v) => !v)}
          >
            {reducedMotion ? "저사양·모션축소 ON" : "모션 축소 OFF"}
          </button>
          <button type="button" className="mp-pill-btn" onClick={handleResetDemo}>
            데모 초기화
          </button>
        </div>
      </header>

      <div className="mp-lab-stage">
        {/* Galaxy 390px Portrait Frame */}
        <section className="mp-phone" aria-label={concept.name}>
          <div className="mp-bg-layer" style={{ backgroundImage: `url(${concept.bg})` }} />
          <div className={`mp-bg-scrim ${concept.scrim}`} />

          <div className="mp-screen-content">
            {/* 공통 상단 HUD */}
            <div className="mp-hud">
              <div className="mp-profile-chip">
                <span className="mp-lv-badge">Lv.{PROTOTYPE_SAMPLE_STATE.child.level}</span>
                <span className="mp-profile-name">{PROTOTYPE_SAMPLE_STATE.child.name} · {PROTOTYPE_SAMPLE_STATE.child.levelTitle}</span>
              </div>
              <div className="mp-hud-right">
                <div className={`mp-vault-pill ${vaultPulse ? "pulse" : ""}`} title="보석 보관함">
                  <img src={GEM_CATALOG[5].image} alt="" />
                  <span>{collected.length}/{GEM_CATALOG.length}</span>
                  <span style={{ opacity: 0.7, fontSize: 11 }}>· {coins}</span>
                </div>
              </div>
            </div>

            {/* 시안별 메인 히어로 영역 */}
            {conceptId === "A" && (
              <div className="mp-hero-a">
                <span className="mp-stage-tag">🌲 제 3구역 · 황혼의 수정 숲 ({PROTOTYPE_SAMPLE_STATE.child.streakDays}일 연속)</span>
                <div className="mp-speech">미션 완료하고 별빛 자수정을 찾아보자!</div>
                <div className="mp-char-wrap">
                  <div className="mp-char-shadow" />
                  <img className="mp-char-img" src={PROTOTYPE_SAMPLE_STATE.child.characterImg} alt="탐험가 캐릭터" />
                </div>
              </div>
            )}

            {conceptId === "B" && (
              <div className="mp-hero-b">
                <div className="mp-hero-b-top">
                  <h2>✨ 나의 보석 성소 도감</h2>
                  <span>수집률 {Math.round((collected.length / GEM_CATALOG.length) * 100)}% ({collected.length}/{GEM_CATALOG.length})</span>
                </div>
                <div className="mp-gem-grid">
                  {GEM_CATALOG.map((g) => {
                    const owned = collected.includes(g.id);
                    const rar = rarityInfo(g.rarity);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`mp-gem-slot ${owned ? "" : "locked"} ${selectedGemId === g.id ? "selected" : ""}`}
                        style={{ borderColor: owned ? rar.border : undefined }}
                        onClick={() => setSelectedGemId(g.id)}
                      >
                        <img src={g.image} alt={g.name} />
                        <div className="mp-gem-name">{owned ? g.name : "???"}</div>
                        <span className="mp-rar-dot" style={{ color: rar.color, background: "rgba(0,0,0,0.28)" }}>
                          {rar.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--mp-sub)", display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span><b style={{ color: "var(--mp-gold-l)" }}>{collected.includes(selectedGem.id) ? selectedGem.name : "미발견 보석"}</b> · {selectedGem.region}</span>
                  <span>{selectedGem.cut}</span>
                </div>
              </div>
            )}

            {conceptId === "C" && (
              <>
                <div className="mp-hero-c">
                  <div className="mp-hero-c-row">
                    <div className="mp-char-wrap">
                      <div className="mp-char-shadow" style={{ width: 88 }} />
                      <img className="mp-char-img" src={PROTOTYPE_SAMPLE_STATE.child.characterImg} alt="탐험가 캐릭터" />
                    </div>
                    <div className="mp-hero-c-info">
                      <span className="mp-lv-badge" style={{ marginBottom: 6, display: "inline-block" }}>🔥 {PROTOTYPE_SAMPLE_STATE.child.streakDays}일 연속 탐험</span>
                      <h2>오늘의 보석 탐험!</h2>
                      <div className="mp-hero-c-sub">미션 {doneCount}/{missions.length} 완료 · 보석 {collected.length}/{GEM_CATALOG.length} 발견</div>
                      <div className="mp-xp-bar" role="progressbar" aria-valuenow={xpPercent} aria-valuemin={0} aria-valuemax={100}>
                        <div className="mp-xp-fill" style={{ width: `${xpPercent}%` }} />
                      </div>
                      <div className="mp-xp-meta">
                        <span>XP {xp}</span>
                        <span>다음 레벨까지 {Math.max(0, PROTOTYPE_SAMPLE_STATE.child.nextLevelXp - xp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mp-next-gem-strip">
                    <img src={nextLockedGem.image} alt="" style={{ filter: collected.includes(nextLockedGem.id) ? "none" : "brightness(0.45)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mp-gold-l)" }}>
                        다음 목표 보석: {nextLockedGem.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--mp-sub)" }}>{nextLockedGem.unlockHint}</div>
                    </div>
                  </div>
                </div>

                {/* 미니 보석 도감 띠 */}
                <div className="mp-gem-strip" aria-label="수집한 보석 6종">
                  {GEM_CATALOG.map((g) => {
                    const owned = collected.includes(g.id);
                    const rar = rarityInfo(g.rarity);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`mp-gem-slot ${owned ? "" : "locked"} ${selectedGemId === g.id ? "selected" : ""}`}
                        style={{ borderColor: owned ? rar.border : undefined }}
                        onClick={() => setSelectedGemId(g.id)}
                        title={owned ? g.name : `${g.name} (미발견)`}
                      >
                        <img src={g.image} alt={g.name} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 공통 오늘의 미션 리스트 (클릭 시 보석 획득 7단계 연출 발동) */}
            <div className="mp-section-head">
              <h3>오늘의 미션</h3>
              <span>{doneCount} / {missions.length} 완료</span>
            </div>
            <div className="mp-missions">
              {missions.map((m) => {
                const gem = gemById[m.rewardGemId];
                const isDone = m.status === "approved";
                return (
                  <div key={m.id} className={`mp-mission-card ${isDone ? "done" : ""}`}>
                    <div className="mp-mission-gem">
                      <img src={gem.image} alt={gem.name} />
                    </div>
                    <div className="mp-mission-info">
                      <div className="mp-mission-meta">{m.academy} · {m.time}</div>
                      <div className="mp-mission-title">{m.title}</div>
                      <div className="mp-mission-reward">보상: {gem.name} · +{m.rewardXp} XP</div>
                    </div>
                    <button
                      type="button"
                      className="mp-action-btn"
                      disabled={isDone}
                      onClick={() => handleCompleteMission(m)}
                    >
                      {isDone ? "완료됨" : "완료하기"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 네비게이션 */}
          <nav className="mp-bottom-nav" aria-label="메인 탐색">
            <button type="button" className={`mp-nav-item ${conceptId !== "B" ? "active" : ""}`}><span>🗺️</span>모험</button>
            <button type="button" className="mp-nav-item"><span>⚔️</span>미션</button>
            <button type="button" className={`mp-nav-item ${conceptId === "B" ? "active" : ""}`}><span>💎</span>보석도감</button>
            <button type="button" className="mp-nav-item"><span>🎒</span>캐릭터</button>
          </nav>

          {/* STEP 6: 보석 획득 7단계 인터랙션 오버레이 */}
          {revealState && (
            <div className="mp-reveal-overlay" role="dialog" aria-modal="true" aria-label="보석 획득 연출">
              <div className="mp-reveal-stage">
                <div className="mp-rays" />
                <div className="mp-aura" style={{ background: revealState.gem.color }} />
                {!reducedMotion && SPARKLES.map((sp, idx) => (
                  <span
                    key={idx}
                    className="mp-sparkle"
                    style={{
                      background: rarityInfo(revealState.gem.rarity).particles[idx % 3],
                      "--tx": sp.tx,
                      "--ty": sp.ty,
                      animationDelay: sp.delay,
                    }}
                  />
                ))}
                <img
                  className={`mp-reveal-gem ${revealState.phase === "flying" ? "flying" : ""}`}
                  src={revealState.gem.image}
                  alt={revealState.gem.name}
                />
              </div>
              <span
                className="mp-reveal-badge"
                style={{
                  color: rarityInfo(revealState.gem.rarity).color,
                  border: `1px solid ${rarityInfo(revealState.gem.rarity).border}`,
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                {rarityInfo(revealState.gem.rarity).label} 보석 발견!
              </span>
              <h2 className="mp-reveal-title">{revealState.gem.name}</h2>
              <p className="mp-reveal-desc">
                「{revealState.mission.title}」 완료 보상으로 획득했어요!<br />
                {revealState.gem.lore}
              </p>
              <button
                type="button"
                className="mp-action-btn"
                style={{ minWidth: 196, minHeight: 50, fontSize: 15 }}
                disabled={revealState.phase === "flying"}
                onClick={handleCollectToVault}
              >
                {revealState.phase === "flying" ? "보석함으로 이동 중..." : "보석함에 넣기 ✨"}
              </button>
            </div>
          )}
        </section>

        {/* 우측 시안 분석 · 비교 패널 */}
        <aside className="mp-side-panel">
          <div>
            <h2>{concept.name}</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--mp-sub)", lineHeight: 1.55 }}>{concept.summary}</p>
          </div>

          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--mp-gold-l)" }}>3종 시안 공정 비교 (동일 샘플 데이터)</h3>
            <table className="mp-compare-table">
              <thead>
                <tr>
                  <th>평가 항목</th>
                  <th>시안 A</th>
                  <th>시안 B</th>
                  <th>시안 C (추천)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>그래픽 완성도</td><td>★★★★★</td><td>★★★★★</td><td>★★★★★</td></tr>
                <tr><td>보석 수집 매력</td><td>★★★☆☆</td><td>★★★★★</td><td>★★★★☆</td></tr>
                <tr><td>초등학생 사용 편의성</td><td>★★★★☆</td><td>★★★☆☆</td><td>★★★★★</td></tr>
                <tr><td>모바일 가독성</td><td>★★★★☆</td><td>★★★★☆</td><td>★★★★★</td></tr>
                <tr><td>기존 기능 연결성</td><td>★★★★☆</td><td>★★★☆☆</td><td>★★★★★</td></tr>
                <tr><td>장기 확장성</td><td>★★★★☆</td><td>★★★★☆</td><td>★★★★★</td></tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: "var(--mp-sub)", lineHeight: 1.6 }}>
            <b style={{ color: "var(--mp-gold-l)" }}>체험 가이드 (STEP 6):</b><br />
            1. 왼쪽 갤럭시 화면에서 <b>[완료하기]</b> 버튼을 눌러 보석 획득 7단계 애니메이션을 확인하세요.<br />
            2. <b>[보석함에 넣기]</b>를 누르면 보석이 상단 보석함으로 날아가고 도감 슬롯이 채워집니다.<br />
            3. 이미 완료된 미션은 중복 탭해도 보석이 재지급되지 않습니다.
          </div>
        </aside>
      </div>
    </div>
  );
}
