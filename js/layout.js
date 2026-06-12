/**
 * layout.js — Sidebar adaptado por rol.
 * Todos los roles tienen la zona inferior clickeable para abrir el modal de perfil.
 * El proveedor ve solo "Mis productos". Admin y Comercial ven Dashboard + Productos (+ Usuarios para admin).
 */

function renderizarLayout() {
  const usuario = getCurrentUser();
  if (!usuario) return;

  const esProveedor = usuario.rol === "proveedor";

  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.innerHTML = `
      <div class="sidebar__logo">
        <div class="sidebar__logo-marca">
          <div class="sidebar__avatar" id="usuario-avatar"></div>
          <div class="sidebar__logo-texto">
            <span class="sidebar__logo-nombre" id="usuario-nombre"></span>
            <span class="sidebar__logo-sub" id="usuario-rol"></span>
          </div>
        </div>
      </div>

      <nav class="sidebar__nav" aria-label="Navegacion principal">
        <span class="sidebar__seccion-titulo">Menu principal</span>
        <ul>
          ${!esProveedor ? `
          <li>
            <a href="dashboard.html">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
              Dashboard
            </a>
          </li>` : ""}
          <li>
            <a href="productos.html">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-2h11v2zm5-4H4v-2h16v2zm0-4H4V8h16v2z"/></svg>
              ${esProveedor ? "Mis productos" : "Productos"}
            </a>
          </li>
        </ul>

        ${!esProveedor ? `
        <span class="sidebar__seccion-titulo" data-roles="administrador">Administracion</span>
        <ul data-roles="administrador">
          <li>
            <a href="usuarios.html">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              Usuarios
            </a>
          </li>
        </ul>` : ""}
      </nav>

      <!-- Zona de configuracion — SIEMPRE clickeable para todos los roles -->
      <div class="sidebar__usuario sidebar__usuario--clickeable"
           id="sidebar-usuario-btn"
           role="button"
           tabindex="0"
           title="Configuracion: cambiar foto y cerrar sesion"
           aria-label="Abrir configuracion">
        <div class="sidebar__config-icono">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0 0 14 2h-4c-.24 0-.43.17-.47.41l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.23.41.47.41h4c.24 0 .43-.17.47-.41l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
          </svg>
        </div>
        <div class="sidebar__usuario-info">
          <span class="sidebar__usuario-nombre">Configuracion</span>
          <span class="sidebar__usuario-rol">Perfil y sesion</span>
        </div>
        <svg class="sidebar__usuario-chevron" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </div>
    `;

    // TODOS los roles abren el modal de perfil
    const btnUsuario = document.getElementById("sidebar-usuario-btn");
    if (btnUsuario) {
      btnUsuario.addEventListener("click", configurarModalPerfil);
      btnUsuario.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") configurarModalPerfil(); });
    }
  }

  // Modal de confirmacion global
  if (!document.getElementById("modal-confirmacion")) {
    const mc = document.createElement("div");
    mc.id = "modal-confirmacion";
    mc.className = "modal";
    mc.innerHTML = `
      <div class="modal__box modal__box--pequeno">
        <div class="modal__header">
          <h2 class="modal__titulo"></h2>
          <button class="modal__cerrar modal__btn-cancelar">&times;</button>
        </div>
        <div class="modal__cuerpo"><p class="modal__mensaje"></p></div>
        <div class="modal__acciones">
          <button class="btn btn--secundario modal__btn-cancelar">Cancelar</button>
          <button class="btn btn--peligro modal__btn-confirmar">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(mc);
  }

  // Overlay sidebar movil
  if (!document.querySelector(".sidebar-overlay")) {
    const ov = document.createElement("div");
    ov.className = "sidebar-overlay";
    document.body.appendChild(ov);
  }
}