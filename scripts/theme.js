/**
 * Light / dark switch.
 *
 * A classic script, loaded in <head> before anything paints, so the page never
 * flashes the wrong colours on the way in. It sets data-theme on <html>; every
 * colour in styles.css comes from a variable that keys off that.
 *
 * First visit follows the system setting. After that the choice is remembered,
 * and stops following the system.
 */
(function () {
  var KEY = "alice-theme";
  var root = document.documentElement;

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function stored() {
    try {
      var value = localStorage.getItem(KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null; // private mode, storage disabled — not worth failing over
    }
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
  }

  /* Runs immediately, before the body exists. */
  apply(stored() || systemTheme());

  /* Follow the system until the reader picks a side. */
  if (window.matchMedia) {
    var query = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () {
      if (!stored()) apply(systemTheme());
    };
    if (query.addEventListener) query.addEventListener("change", onChange);
    else if (query.addListener) query.addListener(onChange);
  }

  function set(theme) {
    apply(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch (error) {
      /* choice just won't persist */
    }
    sync();
  }

  var buttons = [];

  function sync() {
    var current = root.getAttribute("data-theme");
    buttons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.theme === current ? "true" : "false");
    });
  }

  function mount() {
    var host = document.querySelector(".site-header .wrap");
    if (!host || host.querySelector(".theme-toggle")) return;

    var group = document.createElement("div");
    group.className = "theme-toggle";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Colour theme");

    [
      { theme: "light", label: "Light" },
      { theme: "dark", label: "Dark" },
    ].forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.theme = option.theme;
      button.textContent = option.label;
      button.addEventListener("click", function () {
        set(option.theme);
      });
      group.appendChild(button);
      buttons.push(button);
    });

    host.appendChild(group);
    sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.AliceTheme = { set: set, current: function () { return root.getAttribute("data-theme"); } };
})();
