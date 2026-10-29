"use client";

import { useActionState } from "react";
import { emptyActionState, type ActionState } from "@/types/action-state";

export function useFeedbackAction(action: (state: ActionState, data: FormData) => Promise<ActionState>, onResult: (result: ActionState) => void) {
  return useActionState(async (previous: ActionState, data: FormData) => {
    // Let Next handle auth/navigation errors; do not convert redirects into UI success.
    const result = await action(previous, data);
    onResult(result);
    return result;
  }, emptyActionState);
}
