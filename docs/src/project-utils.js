export function stripPrivateFields(project) {
  const { private: _private, ...publicProject } = project;
  return publicProject;
}

export function sortProjectsByDate(projects) {
  return [...projects].sort((a, b) => {
    const bDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
    const aDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
    return bDate - aDate;
  });
}

export function getPublicProjects(projects) {
  return sortProjectsByDate(projects)
    .filter((project) => project.visibility === "public")
    .filter((project) => project.status === "published" || project.status === "archived")
    .map(stripPrivateFields);
}

export function getAllTags(projects) {
  const tags = new Set();

  for (const project of projects) {
    for (const tag of project.tags || []) {
      tags.add(tag);
    }
  }

  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function filterProjects(projects, { query = "", tag = "all" } = {}) {
  const normalizedQuery = query.trim().toLowerCase();

  return projects.filter((project) => {
    const matchesTag = tag === "all" || (project.tags || []).includes(tag);
    const searchableText = [
      project.title,
      project.summary,
      project.description,
      ...(project.tags || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesTag && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });
}
