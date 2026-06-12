/**
 * mockData.js
 * Datos simulados para la fase 1 del proyecto.
 * En la fase 2, estos datos serán reemplazados por Firebase Firestore.
 */

const MOCK_USERS = [
  {
    id: "usr_001",
    nombre: "Carlos Mendoza",
    email: "admin@empresa.com",
    password: "admin123",
    rol: "administrador",
    avatar: "CM",
    activo: true,
    fechaCreacion: "2024-01-15"
  },
  {
    id: "usr_002",
    nombre: "Laura Jiménez",
    email: "proveedor@empresa.com",
    password: "prov123",
    rol: "proveedor",
    avatar: "LJ",
    empresa: "Distribuidora Jiménez S.A.S.",
    activo: true,
    fechaCreacion: "2024-02-01"
  },
  {
    id: "usr_003",
    nombre: "Andrés Castillo",
    email: "comercial@empresa.com",
    password: "com123",
    rol: "comercial",
    avatar: "AC",
    activo: true,
    fechaCreacion: "2024-02-10"
  },
  {
    id: "usr_004",
    nombre: "Diana Torres",
    email: "proveedor2@empresa.com",
    password: "prov456",
    rol: "proveedor",
    avatar: "DT",
    empresa: "Tech Supply Colombia",
    activo: true,
    fechaCreacion: "2024-03-05"
  }
];

const MOCK_CATEGORIAS = [
  "Electrónica",
  "Hogar y Cocina",
  "Deportes y Fitness",
  "Herramientas",
  "Computación",
  "Telefonía",
  "Moda y Accesorios",
  "Juguetes",
  "Belleza y Cuidado Personal",
  "Automotriz"
];

const MOCK_PRODUCTOS = [
  {
    id: "prod_001",
    nombre: "Audífonos Bluetooth Premium TWS",
    categoria: "Electrónica",
    descripcion: "Audífonos inalámbricos con cancelación de ruido activa. Batería de 30 horas de autonomía con estuche de carga. Conectividad Bluetooth 5.3. Resistencia al agua IPX5. Incluye cable USB-C y almohadillas de repuesto.\n\nEspecificaciones: Conectividad Bluetooth 5.3 | Autonomía 30h (auriculares) + 70h (estuche) | Resistencia IPX5 | Driver 13mm | Frecuencia 20Hz-20kHz | Peso 58g",
    precioDML: 85000,
    precioSugerido: 149900,
    stock: 120,
    imagenes: [],
    proveedorId: "usr_002",
    proveedorNombre: "Distribuidora Jiménez S.A.S.",
    fechaCarga: "2024-11-10"
  },
  {
    id: "prod_002",
    nombre: "Silla Ergonómica de Oficina",
    categoria: "Hogar y Cocina",
    descripcion: "Silla de oficina con soporte lumbar ajustable, reposabrazos 3D y base de aluminio de 5 puntas. Mecanismo syncro con ajuste de tensión. Tapizado en malla transpirable.\n\nEspecificaciones: Material Malla + aluminio | Carga máxima 120kg | Altura asiento 42-52cm | Reposabrazos 3D ajustable | Ruedas poliuretano silencioso | Garantía 2 años",
    precioDML: 320000,
    precioSugerido: 549900,
    stock: 45,
    imagenes: [],
    proveedorId: "usr_002",
    proveedorNombre: "Distribuidora Jiménez S.A.S.",
    fechaCarga: "2024-11-18"
  },
  {
    id: "prod_003",
    nombre: "Licuadora de Alta Velocidad 1200W",
    categoria: "Hogar y Cocina",
    descripcion: "Licuadora profesional con motor de 1200W, vaso de vidrio templado de 2 litros. 8 velocidades + función turbo. Cuchillas de acero inoxidable. Función autolimpiable.\n\nEspecificaciones: Potencia 1200W | Capacidad 2L | Velocidades 8 + turbo | Material vaso vidrio templado | Cuchillas acero inoxidable 6 hojas | Voltaje 110V",
    precioDML: 145000,
    precioSugerido: 239900,
    stock: 80,
    imagenes: [],
    proveedorId: "usr_004",
    proveedorNombre: "Tech Supply Colombia",
    fechaCarga: "2024-11-08"
  },
  {
    id: "prod_004",
    nombre: "Monitor Curvo 27\" 165Hz",
    categoria: "Computación",
    descripcion: "Monitor gaming curvo VA de 27 pulgadas con resolución QHD 2560x1440. Tasa de refresco 165Hz. Tiempo de respuesta 1ms MPRT. Compatible con AMD FreeSync Premium.\n\nEspecificaciones: Tamaño 27\" | Panel VA Curvo 1500R | Resolución QHD 2560x1440 | Refresh 165Hz | Respuesta 1ms | HDR400 | Brillo 350 nits | Entradas HDMI 2.0 x2 + DisplayPort 1.4",
    precioDML: 780000,
    precioSugerido: 1199000,
    stock: 25,
    imagenes: [],
    proveedorId: "usr_004",
    proveedorNombre: "Tech Supply Colombia",
    fechaCarga: "2024-11-05"
  },
  {
    id: "prod_005",
    nombre: "Mancuernas Ajustables 20kg",
    categoria: "Deportes y Fitness",
    descripcion: "Set de mancuernas ajustables con discos de hierro fundido y cierre tipo estrella. Incluye barra de 40cm con grip antideslizante. Peso total ajustable de 2kg a 20kg por unidad.\n\nEspecificaciones: Material hierro fundido + acero | Peso por unidad 2-20kg ajustable | Longitud barra 40cm | Sistema cierre collar estrella | Contenido 2 barras + 10 pares de discos",
    precioDML: 210000,
    precioSugerido: 349900,
    stock: 60,
    imagenes: [],
    proveedorId: "usr_002",
    proveedorNombre: "Distribuidora Jiménez S.A.S.",
    fechaCarga: "2024-11-19"
  },
  {
    id: "prod_006",
    nombre: "Smartphone Reacondicionado iPhone 13",
    categoria: "Telefonía",
    descripcion: "iPhone 13 reacondicionado grado A. Pantalla Super Retina XDR 6.1\". Chip A15 Bionic. Cámara dual 12MP. Sin iCloud. IMEI limpio.\n\nEspecificaciones: Modelo iPhone 13 128GB | Grado A (sin rayones visibles) | Batería 87% | Sistema iOS 17 | IMEI Limpio | Incluye Cargador 20W + Cable Lightning",
    precioDML: 1350000,
    precioSugerido: 1899000,
    stock: 15,
    imagenes: [],
    proveedorId: "usr_004",
    proveedorNombre: "Tech Supply Colombia",
    fechaCarga: "2024-11-20"
  },
  {
    id: "prod_007",
    nombre: "Taladro Percutor Inalámbrico 20V",
    categoria: "Herramientas",
    descripcion: "Taladro percutor a batería de 20V con 2 baterías de litio incluidas. 21+1 posiciones de torque. Chuck 13mm sin llave. Velocidad variable 0-450/0-1800 RPM. LED de trabajo integrado.\n\nEspecificaciones: Voltaje 20V Li-Ion | Torque 60Nm | Velocidades 2 | RPM 0-450/0-1800 | Chuck 13mm sin llave | Batería 2.0Ah x2 | Cargador incluido",
    precioDML: 195000,
    precioSugerido: 329900,
    stock: 40,
    imagenes: [],
    proveedorId: "usr_002",
    proveedorNombre: "Distribuidora Jiménez S.A.S.",
    fechaCarga: "2024-11-01"
  },
  {
    id: "prod_008",
    nombre: "Cafetera Express Semi-Automática",
    categoria: "Hogar y Cocina",
    descripcion: "Cafetera espresso con bomba de 15 bares de presión. Vaporizador para espuma de leche. Capacidad depósito 1.5L. Calentamiento en 30 segundos.\n\nEspecificaciones: Presión 15 bares | Potencia 1450W | Depósito 1.5L | Calentamiento 30s | Portafiltros 51mm | Vaporizador incluido | Color Negro/Acero",
    precioDML: 380000,
    precioSugerido: 629900,
    stock: 30,
    imagenes: [],
    proveedorId: "usr_004",
    proveedorNombre: "Tech Supply Colombia",
    fechaCarga: "2024-11-14"
  }
];