let status_timer_id = null;

export function set_status(text, is_error = false) {
  const status = document.getElementById("status");
  status.textContent = text;
  status.classList.toggle("error", is_error);
  status.classList.toggle("visible", text.length > 0);

  if (status_timer_id !== null) {
    window.clearTimeout(status_timer_id);
    status_timer_id = null;
  }

  if (text.length > 0) {
    status_timer_id = window.setTimeout(() => {
      status.classList.remove("visible");
      status_timer_id = null;
    }, is_error ? 3200 : 1400);
  }
}

export function set_loading_status(text) {
  const status = document.getElementById("status");
  status.textContent = text;
  status.classList.remove("error");
  status.classList.add("visible");

  if (status_timer_id !== null) {
    window.clearTimeout(status_timer_id);
    status_timer_id = null;
  }
}
