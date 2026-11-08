const OIDC_ENVIRONMENT_ERROR = /OIDC is enabled for this project, but not for the .+ environment\./i;

export function describePrivateUploadError(error) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (OIDC_ENVIRONMENT_ERROR.test(message)) {
    return {
      status: 503,
      message:
        "Private upload is not enabled for this local environment. Open the Vercel Preview deployment to test uploads, or add a local-only BLOB_READ_WRITE_TOKEN. Your file was not uploaded.",
    };
  }

  if (/No blob credentials found|No read-write token found/i.test(message)) {
    return {
      status: 503,
      message:
        "Private upload credentials are missing. Connect the RoleLinked Blob store to this environment and try again. Your file was not uploaded.",
    };
  }

  return {
    status: /unique/i.test(message) ? 409 : 500,
    message: message || "Unable to upload the resume.",
  };
}
