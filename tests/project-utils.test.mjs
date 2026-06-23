import test from "node:test";
import assert from "node:assert/strict";
import {
  getPublicProjects,
  getAllTags,
  filterProjects,
  sortProjectsByDate
} from "../docs/src/project-utils.js";

const projects = [
  {
    id: "published-new",
    title: "Published New",
    summary: "A Codex web app",
    status: "published",
    visibility: "public",
    tags: ["Codex", "Web"],
    createdAt: "2026-06-21",
    updatedAt: "2026-06-21",
    private: { localPath: "C:/private" }
  },
  {
    id: "published-old",
    title: "Published Old",
    summary: "A document tool",
    status: "published",
    visibility: "public",
    tags: ["Docs"],
    createdAt: "2026-05-01",
    updatedAt: "2026-05-02"
  },
  {
    id: "draft-hidden",
    title: "Draft Hidden",
    summary: "Not public yet",
    status: "draft",
    visibility: "private",
    tags: ["Draft"],
    createdAt: "2026-06-01",
    updatedAt: "2026-06-01"
  }
];

test("getPublicProjects returns only visible public projects without private fields", () => {
  const result = getPublicProjects(projects);

  assert.equal(result.length, 2);
  assert.deepEqual(result.map((project) => project.id), ["published-new", "published-old"]);
  assert.equal(Object.hasOwn(result[0], "private"), false);
});

test("sortProjectsByDate sorts newest created projects first", () => {
  const result = sortProjectsByDate(projects);

  assert.deepEqual(result.map((project) => project.id), [
    "published-new",
    "draft-hidden",
    "published-old"
  ]);
});

test("getAllTags returns unique tags in alphabetical order", () => {
  assert.deepEqual(getAllTags(projects), ["Codex", "Docs", "Draft", "Web"]);
});

test("filterProjects searches title summary and tags", () => {
  assert.deepEqual(filterProjects(projects, { query: "document", tag: "all" }).map((project) => project.id), ["published-old"]);
  assert.deepEqual(filterProjects(projects, { query: "codex", tag: "all" }).map((project) => project.id), ["published-new"]);
  assert.deepEqual(filterProjects(projects, { query: "", tag: "Docs" }).map((project) => project.id), ["published-old"]);
});
