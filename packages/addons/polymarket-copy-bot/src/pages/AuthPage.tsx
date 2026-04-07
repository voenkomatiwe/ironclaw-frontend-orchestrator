/**
 * @deprecated Auth is handled by the main app. This page is no longer used.
 * Kept as placeholder to avoid import errors during cleanup.
 */
import { Navigate } from "react-router";

export default function AuthPage() {
  return <Navigate replace to=".." />;
}
