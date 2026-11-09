"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ActionNotification } from "@/components/ui/action-notification";
import type { ActionState } from "@/types/action-state";

const FeedbackContext = createContext<(state: ActionState) => void>(() => {});
export const useCmsFeedback = () => useContext(FeedbackContext);
export function CmsFeedback({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<ActionState | null>(null);
  return <FeedbackContext.Provider value={setNotice}><ActionNotification key={notice?.resultId} state={notice} />{children}</FeedbackContext.Provider>;
}
