// 보석 수집 도감 순수 상태 로직 (v6_* 호환 키 별도 저장, 기존 데이터 무변경)
import { GEM_CATALOG } from "./gemCatalog.js";

export const GEM_COLLECTION_KEY = "v6_gem_collection";
export const GEM_REDUCED_MOTION_KEY = "v6_gem_reduced_motion";

const GEM_BY_ID = Object.fromEntries(GEM_CATALOG.map((g) => [g.id, g]));

export function getGemById(gemId) {
  return GEM_BY_ID[gemId] || GEM_CATALOG[0];
}

export function normalizeChildGemState(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const ownedIds = Array.isArray(src.ownedIds)
    ? [...new Set(src.ownedIds.filter((id) => Boolean(GEM_BY_ID[id])))]
    : [];
  const counts = src.counts && typeof src.counts === "object" ? { ...src.counts } : {};
  ownedIds.forEach((id) => {
    if (!counts[id] || counts[id] < 1) counts[id] = 1;
  });
  const rewardedQuestKeys = Array.isArray(src.rewardedQuestKeys)
    ? [...new Set(src.rewardedQuestKeys.filter((k) => typeof k === "string" && k.length > 0))]
    : [];
  const history = Array.isArray(src.history) ? src.history.slice(0, 30) : [];
  return { ownedIds, counts, rewardedQuestKeys, history };
}

export function getChildGemState(collectionMap, cid) {
  return normalizeChildGemState(collectionMap && cid ? collectionMap[cid] : null);
}

/**
 * 미션 조건과 현재 보유 상태를 바탕으로 지급할 보석 결정
 * - 미발견 보석을 우선적으로 발견하게 해 초등학생의 수집 성취감 극대화
 * - 6종 모두 수집한 이후에는 미션 성격에 따라 보유 개수 누적
 */
export function pickGemForQuest({ childState, kind = "todo", allDoneToday = false }) {
  const owned = new Set(childState.ownedIds);
  const unowned = GEM_CATALOG.filter((g) => !owned.has(g.id));

  if (unowned.length > 0) {
    // 첫 보석은 항상 햇살 수정
    if (owned.size === 0 && !owned.has("gem_quartz")) {
      return GEM_BY_ID.gem_quartz;
    }
    // 오늘의 미션 올클리어 시 전설 보석(무지개 다이아) 우선 지급
    if (allDoneToday && !owned.has("gem_diamond")) {
      return GEM_BY_ID.gem_diamond;
    }
    // 숙제 미션은 에메랄드 -> 루비 우선
    if (kind === "homework") {
      if (!owned.has("gem_emerald")) return GEM_BY_ID.gem_emerald;
      if (!owned.has("gem_ruby")) return GEM_BY_ID.gem_ruby;
    } else {
      // 할일/습관 미션은 사파이어 -> 자수정 우선
      if (!owned.has("gem_sapphire")) return GEM_BY_ID.gem_sapphire;
      if (!owned.has("gem_amethyst")) return GEM_BY_ID.gem_amethyst;
    }
    // 그 외 남아 있는 미발견 보석 중 첫 번째
    return unowned[0];
  }

  // 6종 모두 수집 후: 올클리어는 다이아, 아니면 누적 완료 수 기반 순환
  if (allDoneToday) return GEM_BY_ID.gem_diamond;
  const totalAwarded = childState.rewardedQuestKeys.length;
  return GEM_CATALOG[totalAwarded % GEM_CATALOG.length];
}

/**
 * 동일 미션 키(questKey)에 대해 1회만 보석을 지급하는 순수 함수
 * - 중복 탭, 체크 해제 후 재체크, 화면 전환, 앱 재실행에서도 중복 지급 차단
 */
export function awardGemForQuest(collectionMap, cid, questKey, meta = {}) {
  if (!cid || !questKey) {
    return { awarded: false, gem: null, isNew: false, nextMap: collectionMap || {} };
  }
  const safeMap = collectionMap && typeof collectionMap === "object" ? collectionMap : {};
  const cur = getChildGemState(safeMap, cid);

  if (cur.rewardedQuestKeys.includes(questKey)) {
    return { awarded: false, gem: null, isNew: false, nextMap: safeMap };
  }

  const gem = pickGemForQuest({
    childState: cur,
    kind: meta.kind || "todo",
    allDoneToday: Boolean(meta.allDoneToday),
  });

  const isNew = !cur.ownedIds.includes(gem.id);
  const nextOwnedIds = isNew ? [...cur.ownedIds, gem.id] : cur.ownedIds;
  const nextCounts = { ...cur.counts, [gem.id]: (cur.counts[gem.id] || 0) + 1 };
  const nextRewardedKeys = [...cur.rewardedQuestKeys, questKey];
  const nextHistory = [
    {
      gemId: gem.id,
      questKey,
      title: meta.title || "미션 완료",
      point: meta.point || 0,
      isNew,
      at: new Date().toISOString(),
    },
    ...cur.history,
  ].slice(0, 30);

  const nextMap = {
    ...safeMap,
    [cid]: {
      ownedIds: nextOwnedIds,
      counts: nextCounts,
      rewardedQuestKeys: nextRewardedKeys,
      history: nextHistory,
    },
  };

  return { awarded: true, gem, isNew, nextMap };
}
