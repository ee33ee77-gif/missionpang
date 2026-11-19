import React from "react";
import { GEM_CATALOG } from "../../data/gemCatalog.js";
import { GEM_DESIGN_TOKENS } from "../../data/gemDesignTokens.js";

/**
 * 시안 C 메인 무대 하단 보석 수집 바
 * - 다음 목표 보석 힌트 + 6종 미니 도감 슬롯 + 도감 탭 바로가기
 */
export default function GemHeroStrip({
  gemState,
  cute = false,
  vaultPulse = false,
  onOpenVault,
}) {
  const ownedIds = gemState?.ownedIds || [];
  const counts = gemState?.counts || {};
  const nextLocked = GEM_CATALOG.find((g) => !ownedIds.includes(g.id)) || null;

  return (
    <div className={`mpg-hero-strip ${cute ? "cute" : ""}`}>
      <div className="mpg-hero-strip-head">
        <div className="mpg-hero-target">
          <img
            src={(nextLocked || GEM_CATALOG[5]).image}
            alt=""
            loading="lazy"
            style={{
              filter: nextLocked ? "brightness(0.42) saturate(0.4)" : "none",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div className="mpg-hero-target-title">
              {nextLocked
                ? `다음 목표: ${nextLocked.name}`
                : "✨ 보석 도감 6종 모두 발견!"}
            </div>
            <div className="mpg-hero-target-sub">
              {nextLocked
                ? nextLocked.unlockHint
                : "미션을 완료하고 보석을 더 모아봐!"}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={`mpg-vault-btn ${vaultPulse ? "pulse" : ""}`}
          onClick={() => onOpenVault && onOpenVault()}
        >
          💎 {ownedIds.length}/{GEM_CATALOG.length}
        </button>
      </div>

      <div className="mpg-mini-grid" aria-label="보석 도감 미리보기">
        {GEM_CATALOG.map((g) => {
          const owned = ownedIds.includes(g.id);
          const qty = counts[g.id] || 0;
          const rar = GEM_DESIGN_TOKENS.rarity[g.rarity] || GEM_DESIGN_TOKENS.rarity.common;
          return (
            <button
              key={g.id}
              type="button"
              className={`mpg-mini-slot ${owned ? "" : "locked"}`}
              style={{ borderColor: owned ? rar.border : undefined }}
              onClick={() => onOpenVault && onOpenVault(g.id)}
              title={owned ? `${g.name} (${qty}개)` : "미발견 보석"}
            >
              <img src={g.image} alt={owned ? g.name : "미발견 보석"} loading="lazy" />
              {owned && qty > 1 && <span className="mpg-mini-count">×{qty}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
