/**
 * auth.js — Sesión, guardias de ruta, modal de perfil.
 * El botón de cerrar sesión vive DENTRO del modal de perfil.
 * Todos los roles (incluyendo proveedor) pueden abrir el modal de perfil.
 * Proveedor puede cambiar foto igual que el resto.
 */

// ─────────────────────────────────────────────
// GUARDIAS DE RUTA
// ─────────────────────────────────────────────

function requireAuth() {
  const usuario = getCurrentUser();
  if (!usuario) { window.location.href = "index.html"; return null; }
  return usuario;
}

function redirectIfAuth() {
  const usuario = getCurrentUser();
  if (!usuario) return;
  window.location.href = usuario.rol === "proveedor" ? "productos.html" : "dashboard.html";
}

function tieneRol(rolesPermitidos) {
  const usuario = getCurrentUser();
  if (!usuario) return false;
  return rolesPermitidos.includes(usuario.rol);
}

function aplicarVisibilidadPorRol() {
  const usuario = getCurrentUser();
  if (!usuario) return;
  document.querySelectorAll("[data-roles]").forEach((el) => {
    const roles = el.getAttribute("data-roles").split(",").map(r => r.trim());
    el.style.display = roles.includes(usuario.rol) ? "" : "none";
  });
}

// ─────────────────────────────────────────────
// RENDERIZADO DE USUARIO EN SIDEBAR
// ─────────────────────────────────────────────

function renderizarUsuarioActivo() {
  const usuario = getCurrentUser();
  if (!usuario) return;
  const elNombre = document.getElementById("usuario-nombre");
  const elRol    = document.getElementById("usuario-rol");
  const elAvatar = document.getElementById("usuario-avatar");
  if (elNombre) elNombre.textContent = usuario.nombre;
  if (elRol)    elRol.textContent    = _formatearRol(usuario.rol);
  if (elAvatar) {
    if (usuario.fotoPerfil) {
      elAvatar.innerHTML = `<img src="${usuario.fotoPerfil}" alt="${usuario.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      elAvatar.textContent = obtenerIniciales(usuario.nombre);
    }
  }
}

function _formatearRol(rol) {
  return { administrador: "Administrador", proveedor: "Proveedor", comercial: "Equipo Comercial" }[rol] || rol;
}

// ─────────────────────────────────────────────
// LOGOUT CON ANIMACIÓN
// ─────────────────────────────────────────────

function configurarBotonLogout() {
  const btn = document.getElementById("btn-logout");
  if (!btn) return;
  const nuevo = btn.cloneNode(true);
  btn.parentNode.replaceChild(nuevo, btn);
  nuevo.addEventListener("click", async (e) => {
    e.preventDefault();
    cerrarModalPerfil();
    mostrarLoader(900);
    setTimeout(async () => {
      try { await logoutUser(); } catch (_) {}
      navegarCon("index.html");
    }, 350);
  });
}

// ─────────────────────────────────────────────
// MODAL DE PERFIL — todos los roles pueden usarlo
// ─────────────────────────────────────────────

function configurarModalPerfil() {
  // Crear modal si no existe aún
  if (!document.getElementById("modal-perfil")) {
    const modal = document.createElement("div");
    modal.id        = "modal-perfil";
    modal.className = "modal-perfil";
    modal.innerHTML = `
      <div class="modal-perfil__box">
        <div class="modal-perfil__header">
          <div class="modal-perfil__avatar-wrap">
            <div class="modal-perfil__avatar" id="perfil-avatar-preview"></div>
            <label class="modal-perfil__avatar-btn" for="perfil-foto-input" title="Cambiar foto" id="perfil-foto-label">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </label>
            <input type="file" id="perfil-foto-input" accept="image/*" style="display:none;">
          </div>
          <div class="modal-perfil__info">
            <p class="modal-perfil__nombre" id="perfil-nombre-display"></p>
            <p class="modal-perfil__rol"    id="perfil-rol-display"></p>
          </div>
        </div>

        <div class="modal-perfil__cuerpo" id="perfil-foto-seccion">
          <p class="modal-perfil__seccion-titulo">Foto de perfil</p>
          <p class="modal-perfil__hint">Haga clic en el avatar para cambiar su foto.</p>
          <button class="btn btn--primario btn--sm" id="btn-guardar-foto" style="margin-top:10px;display:none;">Guardar foto</button>
        </div>

        <div class="modal-perfil__footer">
          <button class="btn btn--secundario btn--sm modal-perfil__cerrar-btn">Cancelar</button>
          <button class="btn btn--peligro btn--sm" id="btn-logout">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Cerrar sesion
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModalPerfil(); });
    modal.querySelector(".modal-perfil__cerrar-btn").addEventListener("click", cerrarModalPerfil);

    // Selección de foto
    document.getElementById("perfil-foto-input").addEventListener("change", async (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      const base64 = await _leerBase64(archivo);
      _renderizarAvatarPerfil(base64, getCurrentUser().nombre);
      const btnGuardar = document.getElementById("btn-guardar-foto");
      btnGuardar.style.display  = "inline-flex";
      btnGuardar._fotoNueva     = base64;
    });

    document.getElementById("btn-guardar-foto").addEventListener("click", async () => {
      const btn  = document.getElementById("btn-guardar-foto");
      const foto = btn._fotoNueva;
      if (!foto) return;
      setBotonCargando(btn, "Guardando...");
      try {
        const sesion = getCurrentUser();
        await updateUserData(sesion.id, { fotoPerfil: foto });
        renderizarUsuarioActivo();
        btn.style.display = "none";
        mostrarToast("Foto de perfil actualizada.", "exito");
      } catch (_) {
        mostrarToast("Error al guardar la foto.", "error");
      } finally {
        resetBoton(btn);
      }
    });
  }

  // Actualizar contenido cada vez que se abre
  const u = getCurrentUser();
  document.getElementById("perfil-nombre-display").textContent = u.nombre;
  document.getElementById("perfil-rol-display").textContent    = _formatearRol(u.rol);
  _renderizarAvatarPerfil(u.fotoPerfil, u.nombre);

  // Todos los roles pueden ver y cambiar foto
  const seccionFoto = document.getElementById("perfil-foto-seccion");
  const labelFoto   = document.getElementById("perfil-foto-label");
  if (seccionFoto) seccionFoto.style.display = "";
  if (labelFoto)   labelFoto.style.display   = "";

  // Ocultar botón guardar hasta que haya foto nueva seleccionada
  const btnGuardar = document.getElementById("btn-guardar-foto");
  if (btnGuardar) btnGuardar.style.display = "none";

  configurarBotonLogout();
  abrirModalPerfil();
}

function _renderizarAvatarPerfil(foto, nombre) {
  const el = document.getElementById("perfil-avatar-preview");
  if (!el) return;
  if (foto) {
    el.innerHTML = `<img src="${foto}" alt="${nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  } else {
    el.textContent = obtenerIniciales(nombre);
  }
}

function abrirModalPerfil() {
  const modal = document.getElementById("modal-perfil");
  if (modal) modal.classList.add("modal-perfil--visible");
}

function cerrarModalPerfil() {
  const modal = document.getElementById("modal-perfil");
  if (modal) modal.classList.remove("modal-perfil--visible");
}

function _leerBase64(archivo) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(archivo);
  });
}