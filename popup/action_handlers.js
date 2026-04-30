import {
  handle_add_tab,
  handle_save_sort,
  handle_start_sort
} from "./bookmark_action_handlers.js";
import {
  handle_search_input,
  handle_source_change
} from "./source_action_handlers.js";

export function configure_action_button_labels() {
  document.getElementById("refresh_button").textContent = "⟳";
  document.getElementById("refresh_button").title = "更新";
  document.getElementById("refresh_button").setAttribute("aria-label", "更新");

  document.getElementById("add_tab_button").textContent = "＋";
  document.getElementById("add_tab_button").title = "Add Tab";
  document.getElementById("add_tab_button").setAttribute("aria-label", "Add Tab");
}

export {
  handle_add_tab,
  handle_save_sort,
  handle_search_input,
  handle_source_change,
  handle_start_sort
};
