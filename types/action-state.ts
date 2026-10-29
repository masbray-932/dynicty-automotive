export type ActionState = {
  message: string;
  errors: Record<string, string[]>;
  status?: "success" | "error" | "warning";
  resultId?: string;
};

export function actionResult(status: NonNullable<ActionState["status"]>, message: string, errors: Record<string, string[]> = {}): ActionState {
  return { status, message, errors, resultId: crypto.randomUUID() };
}

export const emptyActionState: ActionState = { message: "", errors: {} };
