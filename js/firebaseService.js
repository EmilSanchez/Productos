/**
 * firebaseService.js
 * Capa de servicio conectada a Firebase Auth y Firestore.
 *
 * Usa la API "compat" de Firebase (objeto global `firebase`), cargada
 * mediante los scripts de gstatic.com que deben incluirse ANTES de este
 * archivo en cada pagina HTML:
 *
 *   <script src="https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js"></script>
 *
 * No usar import / export aqui: este archivo se carga como script clasico.
 *
 * La interfaz publica (nombres y firmas) es la misma usada por auth.js,
 * layout.js, products.js y usuarios.html.
 */

// ─────────────────────────────────────────────
// CONFIGURACIÓN FIREBASE
// ─────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyAFnf3mwsg76DeZTxiVjkqnBpLz7DLwgFU",
  authDomain: "proyectoyeiny.firebaseapp.com",
  databaseURL: "https://proyectoyeiny-default-rtdb.firebaseio.com",
  projectId: "proyectoyeiny",
  storageBucket: "proyectoyeiny.firebasestorage.app",
  messagingSenderId: "1036909708035",
  appId: "1:1036909708035:web:196c670aa36f1ec9d21f36"
};

// App principal (sesion del usuario que esta usando la plataforma)
if (!firebase.apps.find(a => a.name === "[DEFAULT]")) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db   = firebase.firestore();

// ─────────────────────────────────────────────
// LOGIN POR NOMBRE DE USUARIO (no por email)
// ─────────────────────────────────────────────
// Firebase Authentication exige un "email" para email/password auth, pero
// en esta plataforma los usuarios ingresan con un NOMBRE DE USUARIO simple
// (ej: "santi15"). Internamente, cada nombre de usuario se mapea a un
// correo ficticio dentro de este dominio fijo, transparente para el usuario.
const DOMINIO_USUARIOS = "@proveedoresml.app";

/**
 * Convierte un nombre de usuario (ej: "santi15") al email interno
 * que Firebase Authentication usa para esa cuenta.
 */
function _usuarioAEmail(nombreUsuario) {
  let limpio = nombreUsuario.trim().toLowerCase();
  // Si por error ya viene con dominio, no lo duplica
  if (limpio.includes("@")) return limpio;
  return limpio + DOMINIO_USUARIOS;
}

/**
 * Extrae el nombre de usuario desde el email interno de Firebase.
 */
function _emailAUsuario(email) {
  return (email || "").split("@")[0];
}


// App secundaria: se usa SOLO para crear cuentas nuevas desde el panel de
// administracion sin cerrar la sesion del administrador que esta logueado.
// (createUserWithEmailAndPassword en la app principal cambiaria la sesion
// activa al usuario recien creado, lo cual no queremos).
function _getSecondaryApp() {
  let secApp = firebase.apps.find(a => a.name === "Secondary");
  if (!secApp) {
    secApp = firebase.initializeApp(firebaseConfig, "Secondary");
  }
  return secApp;
}

function _getSecondaryAuth() {
  return _getSecondaryApp().auth();
}

// ─────────────────────────────────────────────
// AUTENTICACIÓN
// ─────────────────────────────────────────────

/**
 * Inicia sesion con NOMBRE DE USUARIO y contrasena (ej: "santi15" / "santi").
 * Internamente convierte el nombre de usuario a un email ficticio para
 * Firebase Authentication.
 *
 * Busca los datos adicionales del usuario (rol, nombre, etc.) en la
 * coleccion "usuarios" de Firestore, usando el UID como ID del documento.
 *
 * Guarda la sesion combinada en sessionStorage bajo "pml_sesion" para que
 * getCurrentUser() pueda leerla de forma SINCRONICA en cualquier pagina.
 */
async function loginUser(nombreUsuario, password) {
  try {
    const emailInterno = _usuarioAEmail(nombreUsuario);

    const credencial = await auth.signInWithEmailAndPassword(emailInterno, password);

    const user = credencial.user;

    const usuarioDoc = await db.collection("usuarios").doc(user.uid).get();

    if (!usuarioDoc.exists) {
      await auth.signOut();
      throw new Error("El usuario no tiene datos registrados en Firestore.");
    }

    const sesion = {
      id: user.uid,
      usuario: _emailAUsuario(user.email),
      ...usuarioDoc.data()
    };

    if (sesion.activo === false) {
      await auth.signOut();
      throw new Error("Esta cuenta se encuentra pausada. Contacte al administrador.");
    }

    sessionStorage.setItem("pml_sesion", JSON.stringify(sesion));

    return { usuario: sesion };
  } catch (error) {
    if (error.message && (error.message.includes("Firestore") || error.message.includes("pausada"))) {
      throw error;
    }
    throw new Error("Usuario o contraseña incorrectos.");
  }
}

/**
 * Cierra la sesion activa (Firebase Auth + cache local).
 */
async function logoutUser() {
  try {
    await auth.signOut();
  } finally {
    sessionStorage.removeItem("pml_sesion");
  }
}

/**
 * Retorna el usuario autenticado actualmente.
 * Lectura SINCRONICA desde sessionStorage (rellenado en loginUser).
 */
function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("pml_sesion")) || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// PRODUCTOS
// ─────────────────────────────────────────────

/**
 * Obtiene productos, con filtros opcionales por categoria y/o proveedorId.
 * El ordenamiento por fecha se hace en el cliente para evitar requerir
 * indices compuestos en Firestore.
 */
async function getProducts(filtros = {}) {
  let ref = db.collection("productos");

  if (filtros.categoria) {
    ref = ref.where("categoria", "==", filtros.categoria);
  }
  if (filtros.proveedorId) {
    ref = ref.where("proveedorId", "==", filtros.proveedorId);
  }

  const snapshot = await ref.get();

  const productos = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));

  productos.sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga));

  return productos;
}

/**
 * Obtiene un producto por su ID de documento.
 */
async function getProductById(id) {
  const snapshot = await db.collection("productos").doc(id).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

/**
 * Crea un nuevo producto asociado al proveedor autenticado.
 */
async function createProduct(datos) {
  const usuario = getCurrentUser();
  if (!usuario) {
    throw new Error("Debe iniciar sesion para crear productos.");
  }

  const nuevoProducto = {
    ...datos,
    proveedorId: usuario.id,
    proveedorNombre: usuario.empresa || usuario.nombre || usuario.usuario,
    imagenes: datos.imagenes || [],
    fechaCarga: new Date().toISOString().split("T")[0]
  };

  const ref = await db.collection("productos").add(nuevoProducto);

  return { id: ref.id, ...nuevoProducto };
}

/**
 * Actualiza un producto existente.
 */
async function updateProduct(id, cambios) {
  await db.collection("productos").doc(id).update(cambios);
  return { id, ...cambios };
}

/**
 * Elimina un producto.
 */
async function deleteProduct(id) {
  await db.collection("productos").doc(id).delete();
}

// ─────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────

/**
 * Obtiene todos los usuarios registrados (documentos de Firestore).
 */
async function getUsers() {
  const snapshot = await db.collection("usuarios").get();
  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));
}

/**
 * Crea una cuenta de usuario nueva:
 *  1. Crea el usuario en Firebase Authentication usando un email interno
 *     derivado del NOMBRE DE USUARIO (ej: "santi15" -> "santi15@proveedoresml.app"),
 *     mediante una instancia SECUNDARIA de la app para no afectar la sesion
 *     del administrador que esta creando la cuenta.
 *  2. Crea el documento correspondiente en Firestore "usuarios/{uid}".
 *
 * @param {object} datos - { nombre, usuario, password, rol, empresa }
 *   - nombre:   nombre completo para mostrar (ej: "Santiago Perez")
 *   - usuario:  nombre de usuario para iniciar sesion (ej: "santi15")
 * @returns {object} usuario creado con su id (uid)
 */
async function createUserAccount(datos) {
  const secondaryAuth = _getSecondaryAuth();
  const nombreUsuario = datos.usuario.trim().toLowerCase();
  const emailInterno  = _usuarioAEmail(nombreUsuario);

  let credencial;
  try {
    credencial = await secondaryAuth.createUserWithEmailAndPassword(
      emailInterno,
      datos.password
    );
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error("Ya existe un usuario registrado con ese nombre de usuario.");
    }
    if (error.code === "auth/weak-password") {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }
    throw new Error("No se pudo crear la cuenta: " + error.message);
  }

  const nuevoUid = credencial.user.uid;

  const datosFirestore = {
    nombre: datos.nombre,
    usuario: nombreUsuario,
    rol: datos.rol,
    empresa: datos.empresa || "",
    avatar: obtenerIniciales(datos.nombre),
    activo: true,
    fechaCreacion: new Date().toISOString().split("T")[0]
  };

  try {
    // IMPORTANTE: usar la Firestore de la app SECUNDARIA, donde el usuario
    // recien creado ya esta autenticado. Asi la escritura cumple
    // "request.auth != null" sin depender de que haya alguien logueado
    // en la app principal (resuelve el problema de crear el primer admin).
    const secondaryDb = _getSecondaryApp().firestore();
    await secondaryDb.collection("usuarios").doc(nuevoUid).set(datosFirestore);
  } finally {
    // Cerrar la sesion de la app secundaria para dejarla limpia
    await secondaryAuth.signOut();
  }

  return { id: nuevoUid, ...datosFirestore };
}

/**
 * Actualiza campos del documento de un usuario en Firestore
 * (nombre, rol, empresa, activo, foto de perfil, etc.).
 *
 * NOTA: el correo y la contraseña de Firebase Authentication NO se pueden
 * cambiar para OTRO usuario desde el cliente (requiere Firebase Admin SDK).
 * Si necesita esa funcionalidad, debe implementarse con una Cloud Function.
 *
 * @param {string} uid
 * @param {object} cambios
 */
async function updateUserData(uid, cambios) {
  await db.collection("usuarios").doc(uid).update(cambios);

  // Si es el usuario autenticado, refrescar la sesion en cache
  const sesion = getCurrentUser();
  if (sesion && sesion.id === uid) {
    const actualizado = { ...sesion, ...cambios };
    sessionStorage.setItem("pml_sesion", JSON.stringify(actualizado));
  }

  return { id: uid, ...cambios };
}