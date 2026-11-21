// timebean-4de50 Firestore Security Rules와 100% 호환되는 로그인 & 가족 초대 서비스
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db, firebaseConfigured } from "../firebase.js";

export const INVITE_TTL_MS = 10 * 60 * 1000; // 10분 (firestore.rules ttl() 일치)

export function formatFirebaseError(err) {
  const code = err?.code || "";
  if (code === "auth/invalid-email") return "이메일 형식이 올바르지 않아.";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "이메일 또는 비밀번호가 맞지 않아.";
  }
  if (code === "auth/email-already-in-use") return "이미 가입된 이메일이야. 로그인을 이용해줘.";
  if (code === "auth/weak-password") return "비밀번호는 6자리 이상으로 입력해줘.";
  if (code === "auth/too-many-requests") return "시도가 너무 많아 잠시 후 다시 시도해줘.";
  if (code === "auth/network-request-failed") return "네트워크 연결을 확인해줘.";
  if (code === "permission-denied") return "권한이 없거나 초대 코드가 만료·사용되었어.";
  return err?.message || "처리 중 오류가 발생했어.";
}

export function subscribeAuth(callback) {
  if (!firebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(email, password) {
  if (!firebaseConfigured || !auth) throw new Error("Firebase 설정이 필요해.");
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signInWithEmail(email, password) {
  if (!firebaseConfigured || !auth) throw new Error("Firebase 설정이 필요해.");
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signOutUser() {
  if (!firebaseConfigured || !auth) return;
  await signOut(auth);
}

export async function getUserFamilyProfile(uid) {
  if (!firebaseConfigured || !db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

function generateSixDigitCode() {
  const arr = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    return String(arr[0] % 1000000).padStart(6, "0");
  }
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

function generateFamilyId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `fam_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
  return `fam_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 새 가족 생성 (families + users + parents 원자적 배치)
 */
export async function createFamily({ uid, email, familyName, displayName }) {
  if (!firebaseConfigured || !db) throw new Error("Firebase 설정이 필요해.");
  const cleanFamily = (familyName || "우리 가족").trim().slice(0, 40);
  const cleanName = (displayName || "대표 부모").trim().slice(0, 40);
  if (!cleanFamily || !cleanName) throw new Error("가족 이름과 호칭을 입력해줘.");

  const familyId = generateFamilyId();
  const batch = writeBatch(db);
  batch.set(doc(db, "families", familyId), {
    ownerUid: uid,
    name: cleanFamily,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "users", uid), {
    role: "parent",
    familyId,
    email: email || null,
    createdAt: serverTimestamp(),
    inviteCode: null,
  });
  batch.set(doc(db, "families", familyId, "parents", uid), {
    displayName: cleanName,
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return familyId;
}

/**
 * 6자리 부모 초대 코드 발급 (대표 부모 전용, 10분 유효, 1회 사용)
 */
export async function createParentInvite({ uid, familyId }) {
  if (!firebaseConfigured || !db) throw new Error("Firebase 설정이 필요해.");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSixDigitCode();
    try {
      await setDoc(doc(db, "parentInvites", code), {
        familyId,
        createdBy: uid,
        status: "open",
        createdAt: serverTimestamp(),
      });
      return {
        code,
        expiresAt: Date.now() + INVITE_TTL_MS,
      };
    } catch (e) {
      if (attempt === 4) throw e;
    }
  }
  throw new Error("초대 코드 발급에 실패했어. 다시 시도해줘.");
}

export async function cancelParentInvite(code) {
  if (!firebaseConfigured || !db || !code) return;
  await deleteDoc(doc(db, "parentInvites", code));
}

/**
 * 6자리 초대 코드로 가족 합류 (inviteClaims 기록 -> 코드 검증 -> 원자적 배치 합류)
 */
export async function joinFamilyByInvite({ uid, email, code, displayName }) {
  if (!firebaseConfigured || !db) throw new Error("Firebase 설정이 필요해.");
  const cleanCode = String(code || "").replace(/\D/g, "").slice(0, 6);
  const cleanName = (displayName || "가족 구성원").trim().slice(0, 40);
  if (cleanCode.length !== 6) throw new Error("6자리 숫자 초대 코드를 입력해줘.");
  if (!cleanName) throw new Error("가족 안에서 사용할 호칭을 입력해줘.");

  // 1) inviteClaims/{uid} 시도 기록 (10분 5회 제한 규칙 준수)
  const claimRef = doc(db, "inviteClaims", uid);
  const claimSnap = await getDoc(claimRef);
  if (!claimSnap.exists()) {
    await setDoc(claimRef, {
      code: cleanCode,
      attempts: 1,
      windowStart: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = claimSnap.data();
    const ws = data.windowStart instanceof Timestamp ? data.windowStart.toMillis() : 0;
    const expired = Date.now() - ws >= INVITE_TTL_MS;
    if (!expired && (data.attempts || 0) >= 5) {
      throw new Error("초대 코드 시도가 5회를 초과했어. 10분 뒤에 다시 시도해줘.");
    }
    await setDoc(claimRef, {
      code: cleanCode,
      attempts: expired ? 1 : (data.attempts || 0) + 1,
      windowStart: expired ? serverTimestamp() : data.windowStart,
      updatedAt: serverTimestamp(),
    });
  }

  // 2) 초대 문서 단건 조회
  const inviteRef = doc(db, "parentInvites", cleanCode);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) {
    throw new Error("존재하지 않는 초대 코드야.");
  }
  const invite = inviteSnap.data();
  if (invite.status !== "open") {
    throw new Error("이미 사용된 초대 코드야.");
  }
  const createdMs = invite.createdAt instanceof Timestamp ? invite.createdAt.toMillis() : 0;
  if (createdMs && Date.now() - createdMs >= INVITE_TTL_MS) {
    throw new Error("만료된 초대 코드야. 새 코드를 발급받아줘.");
  }

  const familyId = invite.familyId;
  // 3) 원자적 합류 배치
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), {
    role: "parent",
    familyId,
    email: email || null,
    createdAt: serverTimestamp(),
    inviteCode: cleanCode,
  });
  batch.update(doc(db, "families", familyId), {
    parentUids: arrayUnion(uid),
  });
  batch.update(inviteRef, {
    status: "used",
    usedBy: uid,
    usedAt: serverTimestamp(),
  });
  batch.set(doc(db, "families", familyId, "parents", uid), {
    displayName: cleanName,
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return familyId;
}

/**
 * 가족 정보 + 구성원 목록 실시간 구독
 */
export function subscribeFamily(familyId, callback) {
  if (!firebaseConfigured || !db || !familyId) {
    callback({ family: null, parents: [] });
    return () => {};
  }
  let latestFamily = null;
  let latestParents = [];
  const emit = () => callback({ family: latestFamily, parents: latestParents });

  const unsubFam = onSnapshot(
    doc(db, "families", familyId),
    (snap) => {
      latestFamily = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      emit();
    },
    () => emit()
  );

  const unsubParents = onSnapshot(
    collection(db, "families", familyId, "parents"),
    (qs) => {
      latestParents = qs.docs.map((d) => ({ uid: d.id, ...d.data() }));
      emit();
    },
    () => emit()
  );

  return () => {
    unsubFam();
    unsubParents();
  };
}

/**
 * 가족 구성원 탈퇴(본인) 또는 내보내기(대표 부모)
 */
export async function removeFamilyParent({ familyId, targetUid, isSelf }) {
  if (!firebaseConfigured || !db || !familyId || !targetUid) return;
  const batch = writeBatch(db);
  batch.update(doc(db, "families", familyId), {
    parentUids: arrayRemove(targetUid),
  });
  batch.delete(doc(db, "families", familyId, "parents", targetUid));
  if (isSelf) {
    batch.delete(doc(db, "users", targetUid));
  }
  await batch.commit();
}
