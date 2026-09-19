/**
 * Small front-end helpers. No animation, no tracking.
 */
(function () {
  "use strict";

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Tab") {
      return;
    }
    document.body.classList.add("has-keyboard-nav");
  });
})();
