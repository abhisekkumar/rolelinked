import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

let loaded;

function resolveProvidersRoot() {
  const candidates = [
    path.join(process.cwd(), "providers"),
    path.join(process.cwd(), "..", "providers"),
  ];
  const root = candidates.find(existsSync);
  if (!root) throw new Error("Shared Career Ops providers were not packaged with this deployment.");
  return root;
}

async function loadSharedProviders() {
  if (loaded) return loaded;
  const root = resolveProvidersRoot();
  const fromRoot = (file) => pathToFileURL(path.join(root, file)).href;
  loaded = Promise.all([
    import(/* webpackIgnore: true */ fromRoot("greenhouse.mjs")),
    import(/* webpackIgnore: true */ fromRoot("lever.mjs")),
    import(/* webpackIgnore: true */ fromRoot("ashby.mjs")),
    import(/* webpackIgnore: true */ fromRoot("_http.mjs")),
  ]).then(([greenhouse, lever, ashby, http]) => ({
    providers: {
      greenhouse: greenhouse.default,
      lever: lever.default,
      ashby: ashby.default,
    },
    makeHttpCtx: http.makeHttpCtx,
  }));
  return loaded;
}

export async function fetchCareerOpsAtsBoard(board) {
  const { providers, makeHttpCtx } = await loadSharedProviders();
  const provider = providers[board.provider];
  if (!provider) throw new Error(`Unsupported hosted ATS provider: ${board.provider}`);
  return provider.fetch(board, makeHttpCtx());
}
