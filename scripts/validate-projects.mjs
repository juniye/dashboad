import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "docs");
const filePath = path.join(publicRoot, "projects.json");
const allowedStatuses = new Set(["published", "draft", "archived"]);
const allowedVisibility = new Set(["public", "private"]);
const forbiddenPublicFields = new Set(["private", "localPath", "notes", "nextActions", "apiKey", "secret", "token"]);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function isString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

let projects;
try {
  const raw = fs.readFileSync(filePath, "utf8");
  projects = JSON.parse(raw);
} catch (error) {
  fail(`Unable to read or parse projects.json: ${error.message}`);
}

if (!Array.isArray(projects)) {
  fail("projects.json must contain an array.");
} else {
  const ids = new Set();

  projects.forEach((project, index) => {
    const label = `Project at index ${index}`;

    if (!project || typeof project !== "object" || Array.isArray(project)) {
      fail(`${label} must be an object.`);
      return;
    }

    for (const field of ["id", "title", "summary", "status", "visibility", "createdAt", "updatedAt", "thumbnail"]) {
      if (!isString(project[field])) {
        fail(`${label} must have a non-empty string field: ${field}`);
      }
    }

    for (const field of Object.keys(project)) {
      if (forbiddenPublicFields.has(field)) {
        fail(`${project.id || label} must not include private field in public projects.json: ${field}`);
      }
    }

    if (ids.has(project.id)) {
      fail(`Duplicate project id: ${project.id}`);
    }
    ids.add(project.id);

    if (!allowedStatuses.has(project.status)) {
      fail(`${project.id} has unsupported status: ${project.status}`);
    }

    if (!allowedVisibility.has(project.visibility)) {
      fail(`${project.id} has unsupported visibility: ${project.visibility}`);
    }

    if (!Array.isArray(project.tags)) {
      fail(`${project.id} must have a tags array.`);
    } else {
      project.tags.forEach((tag, tagIndex) => {
        if (!isString(tag)) {
          fail(`${project.id} tag at index ${tagIndex} must be a non-empty string.`);
        }
      });
    }

    if (!project.links || typeof project.links !== "object" || Array.isArray(project.links)) {
      fail(`${project.id} must have a links object.`);
    } else {
      for (const key of ["demo", "github"]) {
        if (Object.hasOwn(project.links, key) && project.links[key] !== "" && !isHttpUrl(project.links[key])) {
          fail(`${project.id} links.${key} must be empty or an http(s) URL.`);
        }
      }
    }

    const thumbnailPath = path.resolve(publicRoot, project.thumbnail);
    if (path.isAbsolute(project.thumbnail) || !thumbnailPath.startsWith(`${publicRoot}${path.sep}`)) {
      fail(`${project.id} thumbnail must be a relative path inside the public directory: ${project.thumbnail}`);
      return;
    }

    if (!fs.existsSync(thumbnailPath)) {
      fail(`${project.id} thumbnail does not exist: ${project.thumbnail}`);
    }
  });
}

if (!process.exitCode) {
  console.log(`Validated ${projects.length} project record(s).`);
}
