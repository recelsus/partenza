export function send_message(message) {
  return chrome.runtime.sendMessage(message);
}
