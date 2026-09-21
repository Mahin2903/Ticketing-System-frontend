// src/lib/swal.js
import Swal from "sweetalert2";

export const swalTheme = { /* ... */ };

// inject styles once
if (typeof document !== "undefined" && !document.getElementById("swal-custom-styles")) {
  const style = document.createElement("style");
  style.id = "swal-custom-styles";
  style.textContent = `/* full CSS */`;
  document.head.appendChild(style);
}

export const showToast = (icon, title, timer = 2200) =>
  Swal.fire({ ...swalTheme, toast: true, position: "top-end", showConfirmButton: false, timer, timerProgressBar: true, icon, title, customClass: { popup: "swal-popup-custom", title: "swal-title-custom" } });

export const confirmDialog = ({ title, html, confirmText = "Confirm", cancelText = "Cancel", icon = "question", confirmColor = "#7c3aed" }) =>
  Swal.fire({ ...swalTheme, title, html, icon, showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: cancelText, confirmButtonColor: confirmColor, reverseButtons: true, focusCancel: true });