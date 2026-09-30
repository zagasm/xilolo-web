import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";

import {
  dedupeEvents,
  readNextPageParam,
} from "../paginationUtils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(__dirname, "../..");

function readSource(relativePath) {
  return readFileSync(resolve(sourceRoot, relativePath), "utf8");
}

/**
 * Comments in this repo legitimately QUOTE the old bug
 * ("`meta.current_page >= meta.last_page` was `1 >= 1` because the API sends
 * neither field"), so a naive source grep matches the documentation rather than
 * the code. Strip comments before asserting on structure.
 */
function readCode(relativePath) {
  return readSource(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/*
 * The payload these tests pin down, verbatim from production on 2026-09-30:
 *
 *   "meta": { "path": "...", "per_page": [20, 20], "next_cursor": ["eyJ…", "eyJ…"],
 *             "prev_cursor": [null, null], "count": 20, "type": "all", "filters_used": [] }
 *
 * There is NO current_page, last_page or total. The old hook assumed there was,
 * fabricated `last_page: 1`, and so every consumer concluded page 1 was the whole
 * feed — silently capping /feed at 20 events.
 */

test("a real feed payload yields a cursor, not a fabricated page 2", () => {
  const payload = {
    data: [],
    meta: {
      path: "https://api.xilolo.com/api/v1/events/all/get",
      per_page: [20, 20],
      next_cursor: ["eyJldm...dWV9", "eyJldm...dWV9"],
      prev_cursor: [null, null],
      count: 20,
      type: "all",
      filters_used: [],
    },
  };

  assert.deepEqual(readNextPageParam(payload), { cursor: "eyJldm...dWV9" });
});

test("no next cursor AND no page meta means the feed is finished", () => {
  // This is the case the old code turned into "page 2 exists" by defaulting
  // last_page to 1 and comparing 1 >= 1.
  assert.equal(readNextPageParam({ meta: { count: 20, next_cursor: null } }), null);
  assert.equal(readNextPageParam({ meta: { next_cursor: [null, null] } }), null);
  assert.equal(readNextPageParam({}), null);
});

test("a page-based endpoint still paginates", () => {
  assert.deepEqual(
    readNextPageParam({ meta: { current_page: 1, last_page: 3 } }),
    { page: 2 },
  );
  // "...and stops on the last page."
  assert.equal(
    readNextPageParam({ meta: { current_page: 3, last_page: 3 } }),
    null,
  );
});

test("the cursor is recovered from links.next when meta omits it", () => {
  assert.deepEqual(
    readNextPageParam({
      meta: {},
      links: { next: "https://api.xilolo.com/api/v1/events/all/get?cursor=abc123" },
    }),
    { cursor: "abc123" },
  );
});

test("a cursor outranks page meta when both are present", () => {
  assert.deepEqual(
    readNextPageParam({
      meta: { next_cursor: ["cur1"], current_page: 1, last_page: 9 },
    }),
    { cursor: "cur1" },
  );
});

test("duplicate events across pages render once", () => {
  // Real measured overlap: ?page=2 repeated 13 of page 1's 20 items.
  const page1 = Array.from({ length: 20 }, (_, i) => ({ id: `e${i}` }));
  const page2 = [
    ...Array.from({ length: 13 }, (_, i) => ({ id: `e${i}` })),
    ...Array.from({ length: 7 }, (_, i) => ({ id: `n${i}` })),
  ];
  const merged = dedupeEvents([...page1, ...page2]);

  assert.equal(merged.length, 27);
  assert.equal(new Set(merged.map((e) => e.id)).size, merged.length);
  assert.deepEqual(merged.slice(0, 2), [{ id: "e0" }, { id: "e1" }]);
  // Keeps the first occurrence's position, so ordering does not jump.
  assert.equal(merged[19].id, "e19");
});

test("events without an id are never collapsed into one another", () => {
  const merged = dedupeEvents([{ title: "a" }, { title: "b" }, { id: "x" }, { id: "x" }]);
  assert.equal(merged.length, 3);
});

test("no consumer recomputes completion from fields the API does not send", () => {
  for (const file of ["pages/Home/index.jsx", "component/Events/SingleEvent/index.jsx"]) {
    const code = readCode(file);
    assert.doesNotMatch(
      code,
      /meta\??\.current_page\s*>=/,
      `${file} must take isDone from the hook, not from a field this API never returns`,
    );
    assert.match(code, /isDone/, `${file} should render its end-of-feed state from isDone`);
  }
});

test("the hook keeps a failed next page from becoming a feed error", () => {
  const source = readCode("hooks/usePaginatedEvents.js");

  // First page failures still surface...
  assert.match(source, /const isFirstPage = !pageParam\?\.cursor/);
  assert.match(source, /if \(isFirstPage\) throw error;/);
  // ...later page failures degrade quietly and stop asking.
  assert.match(source, /next page unavailable for \$\{endpoint\}/);
  assert.match(source, /return \{ items: \[\], meta: null, nextParam: null, failed: true \}/);
  // and hasNextPage/isDone belong to the hook.
  assert.match(source, /const hasNextPage = Boolean\(query\.hasNextPage\)/);
  assert.match(source, /const isDone = !hasNextPage/);
});
