import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

const isGemPrototype =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("prototype") === "gem-redesign";

const GemRedesignLab = isGemPrototype
  ? React.lazy(() => import("./prototype/GemRedesignLab.jsx"))
  : null;

ReactDOM.createRoot(document.getElementById("root")).render(
  isGemPrototype && GemRedesignLab ? (
    <Suspense fallback={<div style={{ padding: 24, color: "#fff", background: "#121a30", minHeight: "100vh" }}>프로토타입 불러오는 중...</div>}>
      <GemRedesignLab />
    </Suspense>
  ) : (
    <App />
  )
);
