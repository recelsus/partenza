export function get_github_group_key(source) {
  if (!source || source.type !== "github") {
    return "";
  }

  return [
    source.owner || "",
    source.repo || "",
    source.branch || ""
  ].join("::");
}

export function group_github_sources(sources) {
  const groups = new Map();

  for (const source of sources) {
    if (source.type !== "github") {
      continue;
    }

    const group_key = get_github_group_key(source);

    if (!groups.has(group_key)) {
      groups.set(group_key, []);
    }

    groups.get(group_key).push(source);
  }

  return groups;
}
