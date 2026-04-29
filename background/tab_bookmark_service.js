export function create_tab_bookmark(tab) {
  const now = new Date().toISOString();

  return {
    id: `tab-${Date.now()}`,
    title: tab.title || tab.url || "Untitled tab",
    url: tab.url || "",
    tags: [],
    note: "Added from the active browser tab.",
    created_at: now,
    updated_at: now
  };
}
