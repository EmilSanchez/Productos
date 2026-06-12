/**
 * app.js — Utilidades compartidas, helpers de UI, animaciones y funciones globales.
 */

// ─────────────────────────────────────────────
// FORMATO Y PRESENTACIÓN
// ─────────────────────────────────────────────

function formatearPeso(valor) {
  if (isNaN(valor) || valor === null) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(valor);
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric", month: "short", day: "numeric"
    }).format(new Date(fechaISO + "T12:00:00"));
  } catch { return fechaISO; }
}

function calcularMargen(precioDML, precioSugerido) {
  if (!precioDML || !precioSugerido || precioDML <= 0) return { monto: 0, porcentaje: 0 };
  const monto = precioSugerido - precioDML;
  return { monto: Math.round(monto), porcentaje: Math.round((monto / precioDML) * 1000) / 10 };
}

function obtenerIniciales(nombre) {
  if (!nombre) return "?";
  const partes = nombre.trim().split(" ");
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

// ─────────────────────────────────────────────
// LOADER — 3 puntos saltando
// ─────────────────────────────────────────────

function mostrarLoader(duracion = 900) {
  const contenedor = document.querySelector(".pagina") || document.body;
  let overlay = contenedor.querySelector("#loader-overlay");
  if (overlay) return; // ya visible

  overlay = document.createElement("div");
  overlay.id = "loader-overlay";
  overlay.innerHTML = `<div class="loader-puntos"><span></span><span></span><span></span></div>`;
  contenedor.appendChild(overlay);

  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("loader-overlay--visible")));
  setTimeout(() => ocultarLoader(), duracion);
}

function ocultarLoader() {
  const overlay = document.querySelector(".pagina #loader-overlay") || document.getElementById("loader-overlay");
  if (!overlay) return;
  overlay.classList.remove("loader-overlay--visible");
  overlay.classList.add("loader-overlay--saliendo");
  setTimeout(() => overlay.remove(), 350);
}

// ─────────────────────────────────────────────
// ANIMACIÓN DE SALIDA (logout / cambio de página)
// ─────────────────────────────────────────────

function navegarCon(url) {
  document.body.classList.add("pagina-salida");
  setTimeout(() => { window.location.href = url; }, 380);
}

// ─────────────────────────────────────────────
// NOTIFICACIONES / TOAST
// ─────────────────────────────────────────────

let _toastTimer = null;

function mostrarToast(mensaje, tipo = "info", duracion = 3500) {
  let contenedor = document.getElementById("toast-contenedor");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "toast-contenedor";
    document.body.appendChild(contenedor);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  toast.innerHTML = `<span class="toast__mensaje">${mensaje}</span>
    <button class="toast__cerrar" aria-label="Cerrar">&times;</button>`;
  toast.querySelector(".toast__cerrar").addEventListener("click", () => _cerrarToast(toast));
  contenedor.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("toast--visible")));
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => _cerrarToast(toast), duracion);
}

function _cerrarToast(toast) {
  toast.classList.remove("toast--visible");
  setTimeout(() => toast.remove(), 300);
}

// ─────────────────────────────────────────────
// MODAL GENÉRICO DE CONFIRMACIÓN
// ─────────────────────────────────────────────

function mostrarConfirmacion({ titulo, mensaje, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", onConfirmar }) {
  const overlay = document.getElementById("modal-confirmacion");
  if (!overlay) return;
  overlay.querySelector(".modal__titulo").textContent = titulo || "Confirmar accion";
  overlay.querySelector(".modal__mensaje").textContent = mensaje || "";
  overlay.querySelector(".modal__btn-confirmar").textContent = textoConfirmar;
  overlay.querySelector(".modal__btn-cancelar").textContent  = textoCancelar;
  overlay.classList.add("modal--visible");
  const cerrar = () => overlay.classList.remove("modal--visible");
  overlay.querySelector(".modal__btn-confirmar").onclick = () => { cerrar(); if (onConfirmar) onConfirmar(); };
  overlay.querySelector(".modal__btn-cancelar").onclick  = cerrar;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrar(); });
}

// ─────────────────────────────────────────────
// ESTADO DE CARGA EN BOTONES
// ─────────────────────────────────────────────

function setBotonCargando(btn, texto = "Procesando...") {
  btn.disabled = true;
  btn._textoOriginal = btn.textContent;
  btn.textContent = texto;
  btn.classList.add("btn--cargando");
}

function resetBoton(btn) {
  btn.disabled = false;
  if (btn._textoOriginal) btn.textContent = btn._textoOriginal;
  btn.classList.remove("btn--cargando");
}

// ─────────────────────────────────────────────
// VALIDACIÓN DE FORMULARIOS
// ─────────────────────────────────────────────

function validarFormulario(form) {
  let valido = true;
  form.querySelectorAll("[required]").forEach((campo) => {
    const grupo = campo.closest(".form-group");
    const error = grupo ? grupo.querySelector(".form-error") : null;
    if (!campo.value.trim()) {
      campo.classList.add("input--error");
      if (error) error.style.display = "block";
      valido = false;
    } else {
      campo.classList.remove("input--error");
      if (error) error.style.display = "none";
    }
  });
  return valido;
}

// ─────────────────────────────────────────────
// NAVEGACIÓN ACTIVA EN SIDEBAR
// ─────────────────────────────────────────────

function marcarNavActiva() {
  const paginaActual = window.location.pathname.split("/").pop();
  document.querySelectorAll(".sidebar__nav a").forEach((enlace) => {
    if (enlace.getAttribute("href") === paginaActual) {
      enlace.closest("li").classList.add("active");
    }
  });
}

// ─────────────────────────────────────────────
// PLACEHOLDER DE IMAGEN
// ─────────────────────────────────────────────

function placeholderImagen(categoria = "") {
  const letra = categoria ? categoria.charAt(0).toUpperCase() : "P";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#EEF2FF"/>
    <text x="100" y="115" font-family="Poppins,sans-serif" font-size="64" font-weight="600" fill="#6B7280" text-anchor="middle">${letra}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// ─────────────────────────────────────────────
// SIDEBAR MÓVIL
// ─────────────────────────────────────────────

function configurarSidebarMovil() {
  const btnToggle = document.getElementById("btn-menu-toggle");
  const sidebar   = document.querySelector(".sidebar");
  const overlay   = document.querySelector(".sidebar-overlay");
  if (!btnToggle || !sidebar) return;
  btnToggle.addEventListener("click", () => {
    sidebar.classList.toggle("sidebar--abierto");
    if (overlay) overlay.classList.toggle("sidebar-overlay--visible");
  });
  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("sidebar--abierto");
      overlay.classList.remove("sidebar-overlay--visible");
    });
  }
}

// ─────────────────────────────────────────────
// ANIMACIÓN DE ENTRADA DE PÁGINA
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("pagina-entrada");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.remove("pagina-entrada");
  }));
});