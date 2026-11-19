import React, { useState, useEffect } from "react";
import { GEM_DESIGN_TOKENS } from "../../data/gemDesignTokens.js";

const SPARKLES = [
  { tx: "-76px", ty: "-70px", delay: "0.05s" },
  { tx: "80px", ty: "-64px", delay: "0.10s" },
  { tx: "-88px", ty: "12px", delay: "0.14s" },
  { tx: "90px", ty: "18px", delay: "0.08s" },
  { tx: "-50px", ty: "78px", delay: "0.18s" },
  { tx: "58px", ty: "76px", delay: "0.12s" },
  { tx: "0px", ty: "-94px", delay: "0.04s" },
  { tx: "0px", ty: "90px", delay: "0.16s" },
];

/**
 * 미션 완료 -> 보석 획득 7단계 연출 모달
 * - 중복 클릭 방지 + prefers-reduced-motion / 저사양 토글 대응
 */
export default function GemAcquireModal({
  reveal,
  reducedMotion = false,
  xpLabel = "XP",
  coinLabel = "코인",
  onCollected,
}) {
  const [phase, setPhase] = useState("show"); // 'show' | 'flying'

  useEffect(() => {
    setPhase("show");
  }, [reveal?.questKey]);

  if (!reveal || !reveal.gem) return null;

  const { gem, isNew, title, point } = reveal;
  const rar = GEM_DESIGN_TOKENS.rarity[gem.rarity] || GEM_DESIGN_TOKENS.rarity.common;

  const handleCollect = () => {
    if (phase === "flying") return;
    const prefersReduced =
      reducedMotion ||
      (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    if (prefersReduced) {
      onCollected && onCollected(reveal);
      return;
    }

    setPhase("flying");
    window.setTimeout(() => {
      onCollected && onCollected(reveal);
    }, GEM_DESIGN_TOKENS.motion.flyMs || 500);
  };

  return (
    <div
      className={`mpg-modal-backdrop ${reducedMotion ? "mpg-reduced" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="보석 획득"
    >
      <div className="mpg-modal-halo">
        <div className="mpg-modal-rays" />
        {!reducedMotion &&
          phase === "show" &&
          SPARKLES.map((s, idx) => (
            <span
              key={idx}
              className="mpg-sparkle"
              style={{
                "--tx": s.tx,
                "--ty": s.ty,
                animationDelay: s.delay,
              }}
            />
          ))}
        <img
          src={gem.image}
          alt={gem.name}
          className={`mpg-modal-gem ${phase === "flying" ? "flying" : ""}`}
        />
      </div>

      <div className="mpg-modal-badge-row">
        <span
          className="mpg-rar-pill"
          style={{
            color: rar.color,
            border: `1px solid ${rar.border}`,
            padding: "4px 12px",
            fontSize: 12,
          }}
        >
          {rar.label} 등급 보석 발견!
        </span>
        {isNew && <span className="mpg-modal-new">NEW 도감 등록</span>}
      </div>

      <h2 className="mpg-modal-title">{gem.name}</h2>
      {title && <p className="mpg-modal-quest">미션 완료 · {title}</p>}
      <p className="mpg-modal-story">{gem.story}</p>

      <div className="mpg-modal-chips">
        {point > 0 && <span className="mpg-modal-chip">+{point} {xpLabel}</span>}
        {point > 0 && <span className="mpg-modal-chip">+{point} {coinLabel}</span>}
        <span className="mpg-modal-chip">{isNew ? "새 보석 획득" : "보석 보관함 +1"}</span>
      </div>

      <button
        type="button"
        className="mpg-modal-cta"
        onClick={handleCollect}
        disabled={phase === "flying"}
      >
        {phase === "flying" ? "보관함으로 이동 중..." : "보관함에 담기"}
      </button>
    </div>
  );
}
