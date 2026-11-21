import React, { useState, useEffect } from "react";
import { GEM_BACKGROUNDS, GEM_CATALOG } from "../../data/gemCatalog.js";
import { GEM_DESIGN_TOKENS } from "../../data/gemDesignTokens.js";
import { getGemById } from "../../data/gemCollection.js";

/**
 * 시안 B 보석 성소 도감 화면 (아이용 "💎 도감" 탭)
 * - 보석 성소 2.5D 배경 + 6종 보석 슬롯 + 희귀도/스토리 상세 카드 + 최근 발견 기록
 */
export default function GemCollectionView({
  childName = "탐험가",
  gemState,
  initialSelectedGemId = null,
  reducedMotion = false,
  onToggleReducedMotion,
  onGoToMissions,
}) {
  const ownedIds = gemState?.ownedIds || [];
  const counts = gemState?.counts || {};
  const history = gemState?.history || [];

  const [selectedId, setSelectedId] = useState(
    () => initialSelectedGemId || ownedIds[ownedIds.length - 1] || GEM_CATALOG[0].id
  );

  useEffect(() => {
    if (initialSelectedGemId) setSelectedId(initialSelectedGemId);
  }, [initialSelectedGemId]);

  const selectedGem = getGemById(selectedId);
  const selectedOwned = ownedIds.includes(selectedGem.id);
  const selectedQty = counts[selectedGem.id] || 0;
  const selectedRar = GEM_DESIGN_TOKENS.rarity[selectedGem.rarity] || GEM_DESIGN_TOKENS.rarity.common;

  const percent = Math.round((ownedIds.length / GEM_CATALOG.length) * 100);
  const totalCount = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);

  return (
    <section className={`mpg-vault-wrap ${reducedMotion ? "mpg-reduced" : ""}`} aria-label="보석 도감">
      <div className="mpg-vault-bg" style={{ backgroundImage: `url(${GEM_BACKGROUNDS.vault})` }} />
      <div className="mpg-vault-scrim" />

      <div className="mpg-vault-inner">
        <div className="mpg-vault-head">
          <div>
            <h2>💎 {childName}의 보석 성소</h2>
            <p>
              도감 수집 {ownedIds.length}/{GEM_CATALOG.length} ({percent}%) · 총 {totalCount}개 보관 중
            </p>
          </div>
          {onToggleReducedMotion && (
            <button
              type="button"
              className={`mpg-motion-toggle ${reducedMotion ? "on" : ""}`}
              onClick={onToggleReducedMotion}
            >
              {reducedMotion ? "저사양 ON" : "모션 기본"}
            </button>
          )}
        </div>

        <div className="mpg-progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="mpg-progress-fill" style={{ width: `${percent}%` }} />
        </div>

        {/* 6종 보석 슬롯 그리드 */}
        <div className="mpg-grid">
          {GEM_CATALOG.map((g) => {
            const owned = ownedIds.includes(g.id);
            const qty = counts[g.id] || 0;
            const rar = GEM_DESIGN_TOKENS.rarity[g.rarity] || GEM_DESIGN_TOKENS.rarity.common;
            const isSel = selectedGem.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className={`mpg-slot ${owned ? "" : "locked"} ${isSel ? "selected" : ""}`}
                style={{ borderColor: isSel ? "#F5C451" : owned ? rar.border : undefined }}
                onClick={() => setSelectedId(g.id)}
              >
                {owned && qty > 0 && <span className="mpg-slot-qty">×{qty}</span>}
                <img src={g.image} alt={owned ? g.name : "미발견 보석"} loading="lazy" />
                <span className="mpg-slot-name">{owned ? g.name : "???"}</span>
                <span className="mpg-rar-pill" style={{ color: rar.color }}>
                  {rar.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 선택한 보석 상세 카드 */}
        <div className="mpg-detail-card">
          <div className={`mpg-detail-img-wrap ${selectedOwned ? "" : "locked"}`}>
            <img src={selectedGem.image} alt={selectedOwned ? selectedGem.name : "미발견 보석"} />
          </div>
          <div className="mpg-detail-body">
            <div className="mpg-detail-title">
              <strong>{selectedOwned ? selectedGem.name : "미발견 보석"}</strong>
              <span
                className="mpg-rar-pill"
                style={{ color: selectedRar.color, border: `1px solid ${selectedRar.border}` }}
              >
                {selectedRar.label}
              </span>
              {selectedOwned && (
                <span style={{ fontSize: 11, fontWeight: 800, color: "#7DF0BE" }}>
                  보유 {selectedQty}개
                </span>
              )}
            </div>
            <div className="mpg-detail-meta">
              {selectedGem.region} · {selectedGem.cut}
            </div>
            <p className="mpg-detail-story">
              {selectedOwned
                ? selectedGem.story
                : `발견 힌트: ${selectedGem.unlockHint}하면 이 보석을 발견할 수 있어!`}
            </p>
          </div>
        </div>

        {/* 최근 발견 기록 */}
        {history.length > 0 ? (
          <div className="mpg-history-box">
            <h3>✨ 최근 발견 기록</h3>
            {history.slice(0, 4).map((h, i) => {
              const g = getGemById(h.gemId);
              return (
                <div key={`${h.questKey}-${i}`} className="mpg-history-row">
                  <img src={g.image} alt={g.name} loading="lazy" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: "#FAF6EC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {g.name} {h.isNew && <span style={{ color: "#7DF0BE", fontSize: 10 }}>NEW</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#9FB0D6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mpg-history-box" style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#C9D2E8" }}>
              오늘의 미션을 완료하면 첫 번째 보석을 발견할 수 있어!
            </p>
            {onGoToMissions && (
              <button
                type="button"
                className="mpg-modal-cta"
                style={{ minHeight: 44, minWidth: 168, fontSize: 13.5 }}
                onClick={onGoToMissions}
              >
                미션 하러 가기
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
