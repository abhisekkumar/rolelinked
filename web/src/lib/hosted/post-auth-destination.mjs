/**
 * Choose the first private screen after authentication.
 *
 * A confirmed persisted completion state is the only reason to bypass setup.
 * Preview mode and storage outages keep the workspace reachable instead of
 * trapping an authenticated user in a setup flow that cannot be saved.
 */
export function hostedPostAuthDestination({
  identityMode,
  databaseConfigured,
  profileAvailable = true,
  onboardingComplete = false,
}) {
  if (identityMode !== "clerk" || !databaseConfigured || !profileAvailable) {
    return "/app/today";
  }

  return onboardingComplete ? "/app/today" : "/onboarding";
}
