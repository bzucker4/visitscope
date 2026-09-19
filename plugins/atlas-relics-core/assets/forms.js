/**
 * Form helpers. Validation is enforced server-side.
 */
(function () {
  "use strict";

  document.querySelectorAll("form.ar-form").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      var required = form.querySelectorAll("[required]");
      var firstInvalid = null;

      required.forEach(function (field) {
        var valid = field.checkValidity();
        field.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid && !firstInvalid) {
          firstInvalid = field;
        }
      });

      if (firstInvalid) {
        event.preventDefault();
        firstInvalid.focus();
      }
    });
  });
})();
