(function () {
  try {
    var t = localStorage.getItem("media-critic-theme");
    var dark =
      t === "dark" ||
      (t !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch {
    document.documentElement.classList.add("dark");
  }
})();
