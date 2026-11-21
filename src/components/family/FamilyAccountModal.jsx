import React, { useState, useEffect } from "react";
import { firebaseConfigured } from "../../firebase.js";
import {
  cancelParentInvite,
  createFamily,
  createParentInvite,
  formatFirebaseError,
  joinFamilyByInvite,
  removeFamilyParent,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
} from "../../data/familyService.js";
import "./familyUi.css";

/**
 * 로그인(이메일/비밀번호 + 게스트 유지) 및 가족 초대 관리 모달
 * - 기존 timebean-4de50 Firebase Auth + Firestore Security Rules 호환
 */
export default function FamilyAccountModal({
  open,
  onClose,
  authUser,
  family,
  parents = [],
  initialInviteCode = "",
  onFamilyChanged,
}) {
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [setupTab, setSetupTab] = useState(() => (initialInviteCode ? "join" : "create")); // 'create' | 'join'
  const [familyName, setFamilyName] = useState("우리 가족");
  const [displayName, setDisplayName] = useState("");
  const [inviteInput, setInviteInput] = useState(initialInviteCode || "");

  const [activeInvite, setActiveInvite] = useState(null); // { code, expiresAt }
  const [remainSec, setRemainSec] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (initialInviteCode) {
      setInviteInput(initialInviteCode);
      setSetupTab("join");
    }
  }, [initialInviteCode]);

  useEffect(() => {
    if (!activeInvite) {
      setRemainSec(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((activeInvite.expiresAt - Date.now()) / 1000));
      setRemainSec(left);
      if (left === 0) setActiveInvite(null);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [activeInvite]);

  if (!open) return null;

  const isOwner = Boolean(authUser && family && family.ownerUid === authUser.uid);

  const runAction = async (fn) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(formatFirebaseError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    runAction(async () => {
      if (!email.trim() || !password) throw new Error("이메일과 비밀번호를 입력해줘.");
      if (authTab === "login") {
        await signInWithEmail(email, password);
        setNotice("로그인 완료!");
      } else {
        await signUpWithEmail(email, password);
        setNotice("회원가입 및 로그인 완료!");
      }
      setPassword("");
    });
  };

  const handleCreateFamily = (e) => {
    e.preventDefault();
    runAction(async () => {
      const fid = await createFamily({
        uid: authUser.uid,
        email: authUser.email,
        familyName,
        displayName: displayName || "대표 부모",
      });
      setNotice("새 가족 공간이 만들어졌어!");
      onFamilyChanged && onFamilyChanged(fid);
    });
  };

  const handleJoinFamily = (e) => {
    e.preventDefault();
    runAction(async () => {
      const fid = await joinFamilyByInvite({
        uid: authUser.uid,
        email: authUser.email,
        code: inviteInput,
        displayName: displayName || "가족 구성원",
      });
      setNotice("가족에 합류했어!");
      onFamilyChanged && onFamilyChanged(fid);
    });
  };

  const handleIssueInvite = () => {
    runAction(async () => {
      const res = await createParentInvite({ uid: authUser.uid, familyId: family.id });
      setActiveInvite(res);
      setNotice("6자리 가족 초대 코드가 발급됐어! (10분 유효)");
    });
  };

  const handleCancelInvite = () => {
    if (!activeInvite) return;
    runAction(async () => {
      await cancelParentInvite(activeInvite.code);
      setActiveInvite(null);
      setNotice("초대 코드를 취소했어.");
    });
  };

  const copyText = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(msg);
    } catch {
      setNotice(text);
    }
  };

  const inviteUrl = activeInvite && typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?invite=${activeInvite.code}`
    : "";

  const formatMmSs = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="mpf-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="계정 및 가족 초대">
      <div className="mpf-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mpf-head">
          <h2>👨‍👩‍👧 계정 · 가족 초대</h2>
          <button type="button" className="mpf-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {!firebaseConfigured && (
          <div className="mpf-msg info">
            Firebase 환경변수(<code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_APP_ID</code>)가 아직 설정되지 않았어.
            설정 전까지는 게스트 모드로 모든 로컬 데이터를 안전하게 계속 쓸 수 있어!
          </div>
        )}

        {initialInviteCode && !family && (
          <div className="mpf-msg info">
            💌 초대 코드 <b>{initialInviteCode}</b>가 감지됐어! 로그인 후 바로 가족에 합류할 수 있어.
          </div>
        )}

        {error && <div className="mpf-msg err">{error}</div>}
        {notice && <div className="mpf-msg ok">{notice}</div>}

        {/* 1) 비로그인 상태 */}
        {!authUser && (
          <>
            <div className="mpf-tabs">
              <button
                type="button"
                className={`mpf-tab ${authTab === "login" ? "active" : ""}`}
                onClick={() => { setAuthTab("login"); setError(""); }}
              >
                이메일 로그인
              </button>
              <button
                type="button"
                className={`mpf-tab ${authTab === "signup" ? "active" : ""}`}
                onClick={() => { setAuthTab("signup"); setError(""); }}
              >
                회원가입
              </button>
            </div>

            <form className="mpf-card" onSubmit={handleAuthSubmit}>
              <label className="mpf-label">이메일</label>
              <input
                className="mpf-input"
                type="email"
                placeholder="parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <label className="mpf-label">비밀번호 (6자 이상)</label>
              <input
                className="mpf-input"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={authTab === "login" ? "current-password" : "new-password"}
              />
              <button type="submit" className="mpf-btn" disabled={busy || !firebaseConfigured}>
                {busy ? "처리 중..." : authTab === "login" ? "로그인하기" : "계정 만들기"}
              </button>
            </form>

            <button type="button" className="mpf-btn-sub" onClick={onClose}>
              게스트로 계속하기 (기존 로컬 데이터 유지)
            </button>
          </>
        )}

        {/* 2) 로그인됨 + 가족 미소속 */}
        {authUser && !family && (
          <>
            <div className="mpf-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "#9fb0d6" }}>로그인 계정</div>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>{authUser.email}</div>
              </div>
              <button
                type="button"
                className="mpf-btn-sub"
                style={{ width: "auto", marginTop: 0, padding: "0 12px", minHeight: 36 }}
                onClick={() => runAction(() => signOutUser())}
              >
                로그아웃
              </button>
            </div>

            <div className="mpf-tabs">
              <button
                type="button"
                className={`mpf-tab ${setupTab === "create" ? "active" : ""}`}
                onClick={() => { setSetupTab("create"); setError(""); }}
              >
                새 가족 만들기
              </button>
              <button
                type="button"
                className={`mpf-tab ${setupTab === "join" ? "active" : ""}`}
                onClick={() => { setSetupTab("join"); setError(""); }}
              >
                초대 코드로 합류
              </button>
            </div>

            {setupTab === "create" ? (
              <form className="mpf-card" onSubmit={handleCreateFamily}>
                <label className="mpf-label">가족 이름</label>
                <input
                  className="mpf-input"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="예: 유찬이네 가족"
                  maxLength={40}
                />
                <label className="mpf-label">내 호칭</label>
                <input
                  className="mpf-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="예: 엄마, 아빠"
                  maxLength={40}
                />
                <button type="submit" className="mpf-btn" disabled={busy}>
                  {busy ? "생성 중..." : "우리 가족 시작하기"}
                </button>
              </form>
            ) : (
              <form className="mpf-card" onSubmit={handleJoinFamily}>
                <label className="mpf-label">6자리 가족 초대 코드</label>
                <input
                  className="mpf-input"
                  inputMode="numeric"
                  maxLength={6}
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="예: 482910"
                />
                <label className="mpf-label">내 호칭</label>
                <input
                  className="mpf-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="예: 아빠, 엄마"
                  maxLength={40}
                />
                <button type="submit" className="mpf-btn" disabled={busy}>
                  {busy ? "합류 중..." : "가족에 합류하기"}
                </button>
              </form>
            )}
          </>
        )}

        {/* 3) 로그인됨 + 가족 소속 완료 */}
        {authUser && family && (
          <>
            <div className="mpf-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <strong style={{ fontSize: 16, color: "#ffe596" }}>🏡 {family.name}</strong>
                <span className="mpf-badge">{isOwner ? "대표 부모" : "가족 구성원"}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#c9d2e8" }}>{authUser.email}</div>
            </div>

            {/* 가족 초대 코드 발급 (대표 부모 전용) */}
            {isOwner && (
              <div className="mpf-card">
                <div style={{ fontSize: 13.5, fontWeight: 900, color: "#ffe596", marginBottom: 4 }}>
                  💌 다른 부모님 초대하기
                </div>
                <div style={{ fontSize: 12, color: "#c9d2e8", marginBottom: 8 }}>
                  6자리 1회용 코드를 발급해 10분 안에 입력하면 같은 가족으로 연결돼.
                </div>

                {activeInvite ? (
                  <>
                    <div className="mpf-code-box">
                      <div style={{ fontSize: 11.5, color: "#c9d2e8" }}>남은 시간 {formatMmSs(remainSec)}</div>
                      <div className="mpf-code-digits">{activeInvite.code}</div>
                    </div>
                    <div className="mpf-row-btns">
                      <button
                        type="button"
                        className="mpf-btn"
                        style={{ marginTop: 0 }}
                        onClick={() => copyText(activeInvite.code, "초대 코드를 복사했어!")}
                      >
                        코드 복사
                      </button>
                      <button
                        type="button"
                        className="mpf-btn-sub"
                        style={{ marginTop: 0 }}
                        onClick={() => copyText(inviteUrl, "초대 링크를 복사했어!")}
                      >
                        초대 링크 복사
                      </button>
                    </div>
                    <button
                      type="button"
                      className="mpf-btn-sub mpf-btn-danger"
                      onClick={handleCancelInvite}
                      disabled={busy}
                    >
                      초대 코드 취소
                    </button>
                  </>
                ) : (
                  <button type="button" className="mpf-btn" onClick={handleIssueInvite} disabled={busy}>
                    {busy ? "발급 중..." : "6자리 초대 코드 만들기"}
                  </button>
                )}
              </div>
            )}

            {/* 가족 구성원 목록 */}
            <div className="mpf-card">
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#ffe596", marginBottom: 6 }}>
                👨‍👩‍👧 가족 구성원 ({parents.length}명)
              </div>
              {parents.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "#9fb0d6" }}>구성원 정보를 불러오는 중...</div>
              ) : (
                parents.map((p) => {
                  const memberIsOwner = p.uid === family.ownerUid;
                  const isMe = p.uid === authUser.uid;
                  return (
                    <div key={p.uid} className="mpf-member-row">
                      <div>
                        <b>{p.displayName || "부모님"}</b>
                        {isMe && <span style={{ marginLeft: 6, fontSize: 11, color: "#7df0be" }}>(나)</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {memberIsOwner && <span className="mpf-badge">대표</span>}
                        {!memberIsOwner && (isOwner || isMe) && (
                          <button
                            type="button"
                            className="mpf-btn-sub mpf-btn-danger"
                            style={{ width: "auto", minHeight: 30, marginTop: 0, padding: "0 10px", fontSize: 11.5 }}
                            disabled={busy}
                            onClick={() =>
                              runAction(async () => {
                                await removeFamilyParent({
                                  familyId: family.id,
                                  targetUid: p.uid,
                                  isSelf: isMe,
                                });
                                if (isMe && onFamilyChanged) onFamilyChanged(null);
                                setNotice(isMe ? "가족에서 나갔어." : "구성원을 내보냈어.");
                              })
                            }
                          >
                            {isMe ? "나가기" : "내보내기"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              className="mpf-btn-sub"
              disabled={busy}
              onClick={() => runAction(() => signOutUser())}
            >
              로그아웃 (로컬 데이터는 유지됨)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
