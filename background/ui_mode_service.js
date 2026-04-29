import { settings_repository } from "./context.js";

export const UI_MODE_VALUES = {
  popup: "popup",
  side_panel: "side_panel"
};

function normalise_ui_mode(ui_mode) {
  if (ui_mode === UI_MODE_VALUES.side_panel) {
    return UI_MODE_VALUES.side_panel;
  }

  return UI_MODE_VALUES.popup;
}

async function configure_popup_mode() {
  await chrome.action.setPopup({ popup: "popup.html" });

  if (chrome.sidePanel?.setOptions) {
    await chrome.sidePanel.setOptions({
      enabled: false,
      path: "sidepanel.html"
    });
  }

  if (chrome.sidePanel?.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: false
    });
  }
}

async function configure_side_panel_mode() {
  await chrome.action.setPopup({ popup: "" });

  if (chrome.sidePanel?.setOptions) {
    await chrome.sidePanel.setOptions({
      enabled: true,
      path: "sidepanel.html"
    });
  }

  if (chrome.sidePanel?.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    });
  }
}

export async function apply_ui_mode(ui_mode) {
  const next_ui_mode = normalise_ui_mode(ui_mode);

  if (next_ui_mode === UI_MODE_VALUES.side_panel) {
    await configure_side_panel_mode();
    return next_ui_mode;
  }

  await configure_popup_mode();
  return next_ui_mode;
}

export async function save_ui_mode(ui_mode) {
  const settings = await settings_repository.get_settings();
  const next_ui_mode = normalise_ui_mode(ui_mode);

  await settings_repository.save_settings({
    ...settings,
    ui_mode: next_ui_mode
  });

  await apply_ui_mode(next_ui_mode);

  return {
    ui_mode: next_ui_mode
  };
}

export async function initialise_ui_mode() {
  const settings = await settings_repository.get_settings();
  await apply_ui_mode(settings.ui_mode);
}
