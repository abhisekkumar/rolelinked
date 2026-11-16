import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

let loaded;

const PUBLIC_FEED_FILES = Object.freeze({
  weworkremotely: "weworkremotely.mjs",
  jobicy: "jobicy.mjs",
  workingnomads: "workingnomads.mjs",
  arbeitnow: "arbeitnow.mjs",
  builtin: "builtin.mjs",
  "4dayweek": "4dayweek.mjs",
  jobspresso: "jobspresso.mjs",
  nodesk: "nodesk.mjs",
  "startup-jobs": "startup-jobs.mjs",
  pythonorg: "pythonorg.mjs",
  "agentic-jobs": "agentic-jobs.mjs",
  landingjobs: "landingjobs.mjs",
  getonbrd: "getonbrd.mjs",
  thehub: "thehub.mjs",
  manfred: "manfred.mjs",
});

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

export async function fetchCareerOpsPublicFeed(source) {
  const file = PUBLIC_FEED_FILES[source.provider];
  if (!file) throw new Error(`Unsupported hosted public-feed provider: ${source.provider}`);
  const root = resolveProvidersRoot();
  const providerModule = await import(/* webpackIgnore: true */ pathToFileURL(path.join(root, file)).href);
  const http = await import(/* webpackIgnore: true */ pathToFileURL(path.join(root, "_http.mjs")).href);
  return providerModule.default.fetch(source.entry || { name: source.name, provider: source.provider }, http.makeHttpCtx());
}
