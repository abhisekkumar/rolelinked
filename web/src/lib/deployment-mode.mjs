const HOSTED_MODE = "hosted";
const REQUIRED_HOSTED_ENV = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

export function deploymentMode(env = process.env) {
  return String(env.ROLELINKED_DEPLOYMENT_MODE || "local").trim().toLowerCase();
}

export function isHostedDeployment(env = process.env) {
  return deploymentMode(env) === HOSTED_MODE;
}

export function missingHostedEnvironment(env = process.env) {
  if (!isHostedDeployment(env)) return [];
  return REQUIRED_HOSTED_ENV.filter((key) => !String(env[key] || "").trim());
}

export function assertHostedEnvironment(env = process.env) {
  const missing = missingHostedEnvironment(env);
  if (missing.length > 0) {
    throw new Error(`RoleLinked hosted mode requires: ${missing.join(", ")}`);
  }
}

export { REQUIRED_HOSTED_ENV };
