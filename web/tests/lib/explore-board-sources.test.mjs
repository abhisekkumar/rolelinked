import assert from "node:assert/strict";
import test from "node:test";

import {
  BOARD_SOURCES,
  DEFAULT_FILTERS,
  filtersToParams,
  paramsToFilters,
  parseExplorePatch,
} from "../../src/lib/explore.ts";

test("all supported public boards are selected by default", () => {
  assert.deepEqual(DEFAULT_FILTERS.boards, [
    "builtin",
    "remoteok",
    "remotive",
    "weworkremotely",
    "himalayas",
    "jobicy",
  ]);
  assert.deepEqual(DEFAULT_FILTERS.boards, BOARD_SOURCES);
});

test("the URL codec preserves an explicit no-board selection", () => {
  const query = filtersToParams({ ...DEFAULT_FILTERS, boards: [] });
  assert.match(query, /(?:^|&)boards=none(?:&|$)/);
  assert.deepEqual(paramsToFilters(new URLSearchParams(query)).boards, []);
});

test("the board patch accepts only known sources and removes duplicates", () => {
  const result = parseExplorePatch({ boards: ["builtin", "unknown", "remoteok", "builtin"] });
  assert.deepEqual(result.boards, ["builtin", "remoteok"]);
});
