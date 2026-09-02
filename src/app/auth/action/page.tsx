import { Suspense } from "react";
import AuthActionPage from "./AuthActionPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white" style={{ background: "#1C2D5A" }}>
          Loading...
        </div>
      }
    >
      <AuthActionPage />
    </Suspense>
  );
}
