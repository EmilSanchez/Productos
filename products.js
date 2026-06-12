/**
 * products.js
 * Lógica del módulo de productos:
 * - Listado con filtros
 * - Carga / edición de producto (proveedor) con hasta 5 imágenes
 * - Vista de detalle con carrusel (solo si hay más de 1 imagen)
 * - Eliminación
 * - Cálculo de margen
 */

const MAX_IMAGENES = 5;

// Estado local del módulo
const ProductosState = {
  lista: [],
  productoSeleccionado: null,
  // Imágenes pendientes en el formulario (base64[])
  imagenesForm: [],
  // Índice activo del carrusel en el modal de detalle
  carruselIndice: 0
};

// ─────────────────────────────────────────────
// INICIALIZACIÓN DE LA PÁGINA
// ─────────────────────────────────────────────

async function inicializarPaginaProductos() {
  const usuario = requireAuth();
  if (!usuario) return;

  // Proveedor no tiene acceso al dashboard: si intenta ir, solo puede ver productos
  renderizarUsuarioActivo();
  aplicarVisibilidadPorRol();
  configurarSidebarMovil();
  configurarBotonLogout();
  marcarNavActiva();
  poblarSelectorCategorias("filtro-categoria");
  poblarSelectorCategorias("campo-categoria");

  await cargarYRenderizarProductos();
  configurarFiltros();
  configurarFormularioProducto();
  configurarModalDetalle();
}

// ─────────────────────────────────────────────
// CARGA Y RENDERIZADO DE TABLA
// ─────────────────────────────────────────────

async function cargarYRenderizarProductos() {
  const usuario = getCurrentUser();
  const filtros = {};
  if (usuario.rol === "proveedor") filtros.proveedorId = usuario.id;

  try {
    mostrarLoader(800);
    ProductosState.lista = await getProducts(filtros);
    renderizarTablaProductos(ProductosState.lista);
    actualizarContadoresFiltro(ProductosState.lista);
  } catch (err) {
    mostrarToast("Error al cargar productos: " + err.message, "error");
  }
}

function renderizarTablaProductos(productos) {
  const tbody           = document.getElementById("tabla-productos-body");
  const contenedorVacio = document.getElementById("tabla-vacia");
  const usuario         = getCurrentUser();
  const esProveedor     = usuario.rol === "proveedor";

  // Ocultar columna de margen para proveedores
  document.querySelectorAll(".col-margen").forEach(el => {
    el.style.display = esProveedor ? "none" : "";
  });

  if (!tbody) return;

  if (!productos || productos.length === 0) {
    tbody.innerHTML = "";
    if (contenedorVacio) contenedorVacio.style.display = "flex";
    return;
  }
  if (contenedorVacio) contenedorVacio.style.display = "none";

  tbody.innerHTML = productos.map((p) => {
    const margen      = calcularMargen(p.precioDML, p.precioSugerido);
    const claseMargen = margen.porcentaje >= 30 ? "margen--bueno" : margen.porcentaje >= 15 ? "margen--regular" : "margen--bajo";
    const imagen      = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : placeholderImagen(p.categoria);
    const puedeEditar = usuario.rol === "administrador" || (usuario.rol === "proveedor" && p.proveedorId === usuario.id);

    return `
      <tr data-id="${p.id}">
        <td>
          <div class="tabla-producto-info">
            <img src="${imagen}" alt="${p.nombre}" class="tabla-producto-img" onerror="this.src='${placeholderImagen(p.categoria)}'">
            <div>
              <span class="tabla-producto-nombre">${p.nombre}</span>
              <span class="tabla-producto-cat">${p.categoria}</span>
            </div>
          </div>
        </td>
        <td class="td-numero">${formatearPeso(p.precioDML)}</td>
        <td class="td-numero">${formatearPeso(p.precioSugerido)}</td>
        <td class="td-numero col-margen">
          <span class="margen-valor ${claseMargen}">${margen.porcentaje}%</span>
        </td>
        <td class="td-numero">${p.stock}</td>
        <td>${formatearFecha(p.fechaCarga)}</td>
        <td>
          <div class="tabla-acciones">
            <button class="btn-accion btn-accion--ver" onclick="abrirModalDetalle('${p.id}')">Ver</button>
            ${puedeEditar ? `<button class="btn-accion btn-accion--editar" onclick="abrirModalEditar('${p.id}')">Editar</button>` : ""}
            ${puedeEditar ? `<button class="btn-accion btn-accion--eliminar" onclick="confirmarEliminar('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')">Eliminar</button>` : ""}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function actualizarContadoresFiltro(productos) {
  const el = document.getElementById("contador-total");
  if (el) el.textContent = productos.length;
}

// ─────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────

function configurarFiltros() {
  ["filtro-busqueda", "filtro-categoria", "filtro-precio-min", "filtro-precio-max"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", aplicarFiltros);
  });
  const btnLimpiar = document.getElementById("btn-limpiar-filtros");
  if (btnLimpiar) btnLimpiar.addEventListener("click", limpiarFiltros);
}

function aplicarFiltros() {
  const busqueda  = document.getElementById("filtro-busqueda")?.value.toLowerCase() || "";
  const categoria = document.getElementById("filtro-categoria")?.value || "";
  const precioMin = parseFloat(document.getElementById("filtro-precio-min")?.value) || 0;
  const precioMax = parseFloat(document.getElementById("filtro-precio-max")?.value) || Infinity;

  const filtrados = ProductosState.lista.filter((p) => {
    const ok1 = !busqueda  || p.nombre.toLowerCase().includes(busqueda) || p.categoria.toLowerCase().includes(busqueda);
    const ok2 = !categoria || p.categoria === categoria;
    const ok3 = p.precioDML >= precioMin && p.precioDML <= precioMax;
    return ok1 && ok2 && ok3;
  });

  renderizarTablaProductos(filtrados);
  actualizarContadoresFiltro(filtrados);
}

function limpiarFiltros() {
  ["filtro-busqueda", "filtro-categoria", "filtro-precio-min", "filtro-precio-max"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  renderizarTablaProductos(ProductosState.lista);
  actualizarContadoresFiltro(ProductosState.lista);
}

// ─────────────────────────────────────────────
// FORMULARIO: NUEVO / EDITAR PRODUCTO
// ─────────────────────────────────────────────

function configurarFormularioProducto() {
  const btnAbrir  = document.getElementById("btn-nuevo-producto");
  const modal     = document.getElementById("modal-producto");
  const form      = document.getElementById("form-producto");
  const btnCerrar = modal?.querySelector(".modal__cerrar");

  if (btnAbrir && modal) {
    btnAbrir.addEventListener("click", () => {
      limpiarFormularioProducto();
      document.getElementById("modal-producto-titulo").textContent = "Cargar nuevo producto";
      modal.classList.add("modal--visible");
    });
  }

  if (btnCerrar) btnCerrar.addEventListener("click", () => modal.classList.remove("modal--visible"));
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("modal--visible"); });

  // Zona de carga de imágenes
  const inputImagenes = document.getElementById("campo-imagenes");
  const zonaUpload    = document.getElementById("zona-upload");

  if (inputImagenes) {
    inputImagenes.addEventListener("change", manejarSeleccionImagenes);
  }

  // Drag & drop
  if (zonaUpload) {
    zonaUpload.addEventListener("dragover", (e) => { e.preventDefault(); zonaUpload.classList.add("zona-upload--drag"); });
    zonaUpload.addEventListener("dragleave", ()  => zonaUpload.classList.remove("zona-upload--drag"));
    zonaUpload.addEventListener("drop", (e) => {
      e.preventDefault();
      zonaUpload.classList.remove("zona-upload--drag");
      const archivos = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
      procesarArchivosImagenes(archivos);
    });
  }

  // Preview de margen en tiempo real
  ["campo-precio-dml", "campo-precio-sugerido"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", actualizarPreviewMargen);
  });

  if (form) form.addEventListener("submit", manejarSubmitProducto);
}

// ── Manejo de múltiples imágenes ──

function manejarSeleccionImagenes(e) {
  const archivos = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
  procesarArchivosImagenes(archivos);
  // Limpiar input para permitir seleccionar los mismos archivos de nuevo
  e.target.value = "";
}

async function procesarArchivosImagenes(archivos) {
  const disponibles = MAX_IMAGENES - ProductosState.imagenesForm.length;
  if (disponibles <= 0) {
    mostrarToast(`El límite es ${MAX_IMAGENES} imágenes por producto.`, "advertencia");
    return;
  }
  const aAgregar = archivos.slice(0, disponibles);
  if (archivos.length > disponibles) {
    mostrarToast(`Solo se agregaron ${disponibles} imagen(es). Se alcanzó el límite de ${MAX_IMAGENES}.`, "advertencia");
  }

  for (const archivo of aAgregar) {
    const base64 = await _leerArchivoBase64(archivo);
    ProductosState.imagenesForm.push(base64);
  }
  renderizarPrevisualizacionImagenes();
}

function renderizarPrevisualizacionImagenes() {
  const contenedor = document.getElementById("imagenes-preview-grid");
  const contador   = document.getElementById("imagenes-contador");
  if (!contenedor) return;

  if (contador) {
    contador.textContent = `${ProductosState.imagenesForm.length} / ${MAX_IMAGENES} imágenes`;
    contador.style.display = ProductosState.imagenesForm.length > 0 ? "block" : "none";
  }

  contenedor.innerHTML = ProductosState.imagenesForm.map((src, i) => `
    <div class="img-thumb-wrap">
      <img src="${src}" alt="Imagen ${i + 1}" class="img-thumb">
      ${i === 0 ? '<span class="img-thumb-principal">Principal</span>' : ""}
      <button type="button" class="img-thumb-eliminar" onclick="eliminarImagenForm(${i})" title="Quitar imagen">&times;</button>
    </div>
  `).join("");

  // Mostrar/ocultar zona de upload según límite
  const zonaTexto = document.getElementById("zona-upload-texto");
  if (zonaTexto) {
    zonaTexto.style.opacity = ProductosState.imagenesForm.length >= MAX_IMAGENES ? "0.4" : "1";
  }
  const inputImagenes = document.getElementById("campo-imagenes");
  if (inputImagenes) inputImagenes.disabled = ProductosState.imagenesForm.length >= MAX_IMAGENES;
}

function eliminarImagenForm(indice) {
  ProductosState.imagenesForm.splice(indice, 1);
  renderizarPrevisualizacionImagenes();
}

// ── Submit del formulario ──

async function manejarSubmitProducto(e) {
  e.preventDefault();
  const form = e.target;
  if (!validarFormulario(form)) return;

  const btn = form.querySelector('[type="submit"]');
  setBotonCargando(btn, "Guardando...");

  const datos = {
    nombre:         document.getElementById("campo-nombre").value.trim(),
    categoria:      document.getElementById("campo-categoria").value,
    descripcion:    document.getElementById("campo-descripcion").value.trim(),
    precioDML:      parseFloat(document.getElementById("campo-precio-dml").value),
    precioSugerido: parseFloat(document.getElementById("campo-precio-sugerido").value),
    stock:          parseInt(document.getElementById("campo-stock").value),
    imagenes:       [...ProductosState.imagenesForm]
  };

  const productoId = form.dataset.productoId;

  try {
    if (productoId) {
      await updateProduct(productoId, datos);
      mostrarToast("Producto actualizado correctamente.", "exito");
      delete form.dataset.productoId;
    } else {
      await createProduct(datos);
      mostrarToast("Producto cargado correctamente.", "exito");
    }
    document.getElementById("modal-producto").classList.remove("modal--visible");
    await cargarYRenderizarProductos();
  } catch (err) {
    mostrarToast("Error al guardar: " + err.message, "error");
  } finally {
    resetBoton(btn);
  }
}

function actualizarPreviewMargen() {
  const dml      = parseFloat(document.getElementById("campo-precio-dml")?.value) || 0;
  const sugerido = parseFloat(document.getElementById("campo-precio-sugerido")?.value) || 0;
  const margen   = calcularMargen(dml, sugerido);
  const el       = document.getElementById("preview-margen");
  if (!el) return;

  if (dml > 0 && sugerido > 0) {
    const clase = margen.porcentaje >= 30 ? "margen--bueno" : margen.porcentaje >= 15 ? "margen--regular" : "margen--bajo";
    el.innerHTML = `Margen estimado: <strong class="${clase}">${margen.porcentaje}% — ${formatearPeso(margen.monto)}</strong>`;
    el.style.display = "block";
  } else {
    el.style.display = "none";
  }
}

function limpiarFormularioProducto() {
  const form = document.getElementById("form-producto");
  if (!form) return;
  form.reset();
  delete form.dataset.productoId;
  ProductosState.imagenesForm = [];
  renderizarPrevisualizacionImagenes();
  const el = document.getElementById("preview-margen");
  if (el) el.style.display = "none";
  form.querySelectorAll(".input--error").forEach(el => el.classList.remove("input--error"));
}

// ─────────────────────────────────────────────
// MODAL DETALLE + CARRUSEL
// ─────────────────────────────────────────────

async function abrirModalDetalle(id) {
  const producto = await getProductById(id);
  if (!producto) return;

  const modal = document.getElementById("modal-detalle");
  if (!modal) return;

  const margen      = calcularMargen(producto.precioDML, producto.precioSugerido);
  const claseMargen = margen.porcentaje >= 30 ? "margen--bueno" : margen.porcentaje >= 15 ? "margen--regular" : "margen--bajo";
  const imagenes    = (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes : [placeholderImagen(producto.categoria)];
  const hayCarrusel = imagenes.length > 1;

  ProductosState.carruselIndice = 0;

  modal.querySelector(".modal-detalle__contenido").innerHTML = `
    <div class="detalle-grid">

      <!-- Columna izquierda: imagen / carrusel -->
      <div class="detalle-imagen-col">
        <div class="carrusel" id="carrusel-detalle">
          <div class="carrusel__pista" id="carrusel-pista">
            ${imagenes.map((src, i) => `
              <div class="carrusel__slide ${i === 0 ? "carrusel__slide--activo" : ""}">
                <img src="${src}" alt="${producto.nombre} — imagen ${i + 1}" class="carrusel__img" onerror="this.src='${placeholderImagen(producto.categoria)}'">
              </div>
            `).join("")}
          </div>

          ${hayCarrusel ? `
          <!-- Controles debajo de la imagen, no encima -->
          <div class="carrusel__controles">
            <button class="carrusel__btn carrusel__btn--prev" onclick="moverCarrusel(-1)" aria-label="Imagen anterior">&#8249;</button>
            <div class="carrusel__dots">
              ${imagenes.map((_, i) => `
                <button class="carrusel__dot ${i === 0 ? "carrusel__dot--activo" : ""}" onclick="irASlide(${i})" aria-label="Imagen ${i + 1}"></button>
              `).join("")}
            </div>
            <button class="carrusel__btn carrusel__btn--next" onclick="moverCarrusel(1)" aria-label="Siguiente imagen">&#8250;</button>
          </div>

          <div class="carrusel__miniaturas">
            ${imagenes.map((src, i) => `
              <img src="${src}" alt="Miniatura ${i + 1}"
                class="carrusel__miniatura ${i === 0 ? "carrusel__miniatura--activa" : ""}"
                onclick="irASlide(${i})"
                onerror="this.src='${placeholderImagen(producto.categoria)}'">
            `).join("")}
          </div>
          ` : ""}
        </div>
      </div>

      <!-- Columna derecha: información -->
      <div class="detalle-info-col">
        <h2 class="detalle-nombre">${producto.nombre}</h2>
        <p class="detalle-cat">${producto.categoria}</p>

        <div class="detalle-precios">
          <div class="detalle-precio-item">
            <span class="detalle-precio-label">Precio DML (IVA + flete incluido)</span>
            <span class="detalle-precio-valor">${formatearPeso(producto.precioDML)}</span>
          </div>
          <div class="detalle-precio-item">
            <span class="detalle-precio-label">Precio sugerido de venta</span>
            <span class="detalle-precio-valor">${formatearPeso(producto.precioSugerido)}</span>
          </div>
          <div class="detalle-precio-item">
            <span class="detalle-precio-label">Margen estimado</span>
            <span class="detalle-precio-valor ${claseMargen}">${margen.porcentaje}% — ${formatearPeso(margen.monto)}</span>
          </div>
          <div class="detalle-precio-item">
            <span class="detalle-precio-label">Stock disponible</span>
            <span class="detalle-precio-valor">${producto.stock} unidades</span>
          </div>
        </div>

        <div class="detalle-seccion">
          <h4 class="detalle-seccion-titulo">Descripcion y ficha tecnica</h4>
          <p class="detalle-texto">${(producto.descripcion || "Sin descripción.").replace(/\n/g, "<br>")}</p>
        </div>

        <div class="detalle-meta">
          <span>Proveedor: <strong>${producto.proveedorNombre}</strong></span>
          <span>Cargado: <strong>${formatearFecha(producto.fechaCarga)}</strong></span>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("modal--visible");
}

// ── Controles del carrusel ──

function moverCarrusel(direccion) {
  const slides = document.querySelectorAll(".carrusel__slide");
  if (!slides.length) return;
  const total = slides.length;
  ProductosState.carruselIndice = (ProductosState.carruselIndice + direccion + total) % total;
  _aplicarCarrusel();
}

function irASlide(indice) {
  ProductosState.carruselIndice = indice;
  _aplicarCarrusel();
}

function _aplicarCarrusel() {
  const idx = ProductosState.carruselIndice;

  document.querySelectorAll(".carrusel__slide").forEach((el, i) => {
    el.classList.toggle("carrusel__slide--activo", i === idx);
  });
  document.querySelectorAll(".carrusel__dot").forEach((el, i) => {
    el.classList.toggle("carrusel__dot--activo", i === idx);
  });
  document.querySelectorAll(".carrusel__miniatura").forEach((el, i) => {
    el.classList.toggle("carrusel__miniatura--activa", i === idx);
  });
}

function configurarModalDetalle() {
  const modal = document.getElementById("modal-detalle");
  if (!modal) return;
  modal.querySelector(".modal__cerrar")?.addEventListener("click", () => modal.classList.remove("modal--visible"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("modal--visible"); });

  // Soporte de teclado para el carrusel
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("modal--visible")) return;
    if (e.key === "ArrowLeft")  moverCarrusel(-1);
    if (e.key === "ArrowRight") moverCarrusel(1);
    if (e.key === "Escape")     modal.classList.remove("modal--visible");
  });
}

// ─────────────────────────────────────────────
// EDITAR PRODUCTO
// ─────────────────────────────────────────────

async function abrirModalEditar(id) {
  const producto = await getProductById(id);
  if (!producto) return;

  const modal = document.getElementById("modal-producto");
  if (!modal) return;

  document.getElementById("modal-producto-titulo").textContent    = "Editar producto";
  document.getElementById("campo-nombre").value                   = producto.nombre;
  document.getElementById("campo-categoria").value                = producto.categoria;
  document.getElementById("campo-descripcion").value              = producto.descripcion || "";
  document.getElementById("campo-precio-dml").value               = producto.precioDML;
  document.getElementById("campo-precio-sugerido").value          = producto.precioSugerido;
  document.getElementById("campo-stock").value                    = producto.stock;

  // Cargar imágenes existentes en el estado del formulario
  ProductosState.imagenesForm = producto.imagenes ? [...producto.imagenes] : [];
  renderizarPrevisualizacionImagenes();

  const form = document.getElementById("form-producto");
  if (form) form.dataset.productoId = id;

  actualizarPreviewMargen();
  modal.classList.add("modal--visible");
}

// ─────────────────────────────────────────────
// ELIMINAR PRODUCTO
// ─────────────────────────────────────────────

function confirmarEliminar(id, nombre) {
  mostrarConfirmacion({
    titulo: "Eliminar producto",
    mensaje: `¿Esta seguro de que desea eliminar "${nombre}"? Esta accion no se puede deshacer.`,
    textoConfirmar: "Eliminar",
    textoCancelar: "Cancelar",
    onConfirmar: async () => {
      try {
        await deleteProduct(id);
        mostrarToast("Producto eliminado.", "exito");
        await cargarYRenderizarProductos();
      } catch (err) {
        mostrarToast("Error al eliminar: " + err.message, "error");
      }
    }
  });
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function poblarSelectorCategorias(id) {
  const selector = document.getElementById(id);
  if (!selector) return;
  const placeholder = selector.options[0];
  selector.innerHTML = "";
  if (placeholder) selector.appendChild(placeholder);
  MOCK_CATEGORIAS.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    selector.appendChild(opt);
  });
}

function _leerArchivoBase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}