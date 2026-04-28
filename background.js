import { handle_add_current_tab_shortcut } from "./background/add_tab_service.js";
import { handle_message } from "./background/message_router.js";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handle_message(message).then(sendResponse).catch((error) => {
    sendResponse({
      ok: false,
      error_code: "runtime_error",
      message: error instanceof Error ? error.message : String(error)
    });
  });

  return true;
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "add-current-tab") {
    handle_add_current_tab_shortcut();
  }
});
