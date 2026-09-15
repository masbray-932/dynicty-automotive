export function isStagingDeployment(environment: Record<string, string | undefined> = process.env) {
  return environment.DEPLOYMENT_ENV === "staging";
}
