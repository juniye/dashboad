import { filterProjects, getAllTags, getPublicProjects } from "./project-utils.js";

const state = {
  projects: [],
  query: "",
  tag: "all"
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

const elements = {
  grid: document.querySelector("[data-project-grid]"),
  statusMessage: document.querySelector("[data-status-message]"),
  resultCount: document.querySelector("[data-result-count]"),
  searchInput: document.querySelector("[data-search-input]"),
  tagFilter: document.querySelector("[data-tag-filter]"),
  totalProjects: document.querySelector("[data-total-projects]"),
  totalTags: document.querySelector("[data-total-tags]")
};

const requiredElements = Object.entries(elements);
const missingElements = requiredElements
  .filter(([, element]) => !element)
  .map(([name]) => name);

if (missingElements.length) {
  throw new Error(`Gallery initialization failed. Missing DOM hooks: ${missingElements.join(", ")}`);
}

function setStatus(message, isVisible = Boolean(message)) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.hidden = !isVisible;
}

function setResultCount(count) {
  elements.resultCount.textContent = `${count}개 프로젝트`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return dateFormatter.format(date);
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  element.textContent = text;
  return element;
}

function getSafeUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function createProjectLink(href, label, className = "") {
  const safeHref = getSafeUrl(href);

  if (!safeHref) {
    return null;
  }

  const link = document.createElement("a");
  link.href = safeHref;
  link.textContent = label;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  if (className) {
    link.className = className;
  }

  return link;
}

function createProjectCard(project) {
  const title = project.title || "Untitled project";
  const summary = project.summary || "No summary available yet.";

  const article = document.createElement("article");
  article.className = "project-card";

  const thumbnail = document.createElement("img");
  thumbnail.src = project.thumbnail || "assets/projects/codex-gallery/thumbnail.svg";
  thumbnail.alt = `${title} thumbnail`;
  thumbnail.loading = "lazy";
  thumbnail.addEventListener("error", () => {
    thumbnail.src = "assets/projects/codex-gallery/thumbnail.svg";
  }, { once: true });
  article.append(thumbnail);

  const body = document.createElement("div");
  body.className = "project-body";

  const meta = document.createElement("div");
  meta.className = "project-meta";

  const dateText = formatDate(project.updatedAt || project.createdAt);
  if (dateText) {
    meta.append(createTextElement("span", "", dateText));
  }

  if (project.status) {
    meta.append(createTextElement("span", "", project.status));
  }

  body.append(meta);
  body.append(createTextElement("h3", "", title));
  body.append(createTextElement("p", "", summary));

  const tags = document.createElement("ul");
  tags.className = "tag-list";

  for (const tag of project.tags || []) {
    const tagItem = document.createElement("li");
    tagItem.className = "tag";
    tagItem.textContent = tag;
    tags.append(tagItem);
  }

  body.append(tags);

  const links = document.createElement("div");
  links.className = "project-links";

  const demoLink = createProjectLink(project.links?.demo, "Demo");
  if (demoLink) {
    links.append(demoLink);
  }

  const githubLink = createProjectLink(project.links?.github, "GitHub", "secondary");
  if (githubLink) {
    links.append(githubLink);
  }

  if (!links.children.length) {
    links.append(createTextElement("span", "", "공개 링크가 없습니다."));
  }

  body.append(links);
  article.append(body);

  return article;
}

function renderTagOptions() {
  const tags = getAllTags(state.projects);

  elements.tagFilter.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "전체";
  elements.tagFilter.append(allOption);

  for (const tag of tags) {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    elements.tagFilter.append(option);
  }

  elements.tagFilter.value = state.tag;
  elements.totalTags.textContent = String(tags.length);
}

function renderProjects() {
  const filteredProjects = filterProjects(state.projects, {
    query: state.query,
    tag: state.tag
  });

  elements.grid.replaceChildren();
  setResultCount(filteredProjects.length);

  if (!filteredProjects.length) {
    setStatus("조건에 맞는 프로젝트가 없습니다.");
    return;
  }

  setStatus("", false);
  elements.grid.append(...filteredProjects.map(createProjectCard));
}

function renderStats() {
  elements.totalProjects.textContent = String(state.projects.length);
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderProjects();
  });

  elements.tagFilter.addEventListener("change", (event) => {
    state.tag = event.target.value;
    renderProjects();
  });
}

async function loadProjects() {
  setStatus("프로젝트를 불러오는 중입니다.");

  try {
    const response = await fetch("projects.json");

    if (!response.ok) {
      throw new Error(`Unable to load projects.json: ${response.status}`);
    }

    const allProjects = await response.json();
    state.projects = getPublicProjects(allProjects);

    renderStats();
    renderTagOptions();
    renderProjects();
  } catch (error) {
    console.error(error);
    elements.grid.replaceChildren();
    elements.resultCount.textContent = "불러오기 실패";
    setStatus(
      "프로젝트 데이터를 불러오지 못했습니다. 로컬 파일로 열었다면 작은 미리보기 서버로 다시 열어주세요."
    );
  }
}

bindEvents();
loadProjects();
