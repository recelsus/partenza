import { settings_repository } from "./context.js";

function normalise_theme_mode(theme_mode) {
  if (theme_mode === "light" || theme_mode === "dark") {
    return theme_mode;
  }

  return "auto";
}

export async function save_theme_mode(theme_mode) {
  const settings = await settings_repository.get_settings();
  const next_theme_mode = normalise_theme_mode(theme_mode);

  await settings_repository.save_settings({
    ...settings,
    theme_mode: next_theme_mode
  });

  return {
    theme_mode: next_theme_mode
  };
}
