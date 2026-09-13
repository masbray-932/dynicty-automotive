export type ActionState = {
  message: string;
  errors: Record<string, string[]>;
};

export const emptyActionState: ActionState = { message: "", errors: {} };
