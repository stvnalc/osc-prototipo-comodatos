import { addDays, todayIso } from "./format"
import type { Comodato, Db, Instrumento, Integrante, Sede } from "./types"

// Datos ficticios para la demo. Las fechas se calculan relativas a "hoy"
// para que siempre existan comodatos vigentes, por vencer y vencidos.

const sedes: Sede[] = [
  { id: "s1", nombre: "Hesperia", direccion: "Av. Bolívar Norte, Valencia", detalle: "Depósito de instrumentos" },
  { id: "s2", nombre: "UJAP", direccion: "Universidad José Antonio Páez, San Diego", detalle: "Salón de ensayos" },
  { id: "s3", nombre: "Av. Bolívar", direccion: "CC Profesional", detalle: "Sede administrativa · Av. Bolívar, Valencia" },
]

type Base = Omit<Instrumento, "id" | "codigo" | "estado" | "sedeId" | "condicion" | "anioAdquisicion" | "serial">

/** clave → [abreviatura del código, ficha base] */
const catalogo: Record<string, { abrev: string; base: Base }> = {
  VIOLIN: { abrev: "Vi", base: { nombre: "Violín", familia: "Cuerdas frotadas", marca: "Yamaha", modelo: "V5SC", medida: "4/4", material: "Pícea y arce", accesorios: ["Estuche", "Arco", "Resina", "Hombrera"] } },
  VIOLIN34: { abrev: "Vi", base: { nombre: "Violín", familia: "Cuerdas frotadas", marca: "Stentor", modelo: "Student II", medida: "3/4", material: "Pícea y arce", accesorios: ["Estuche", "Arco", "Resina"] } },
  VIOLA: { abrev: "Va", base: { nombre: "Viola", familia: "Cuerdas frotadas", marca: "Cremona", modelo: "SVA-175", medida: '15.5"', material: "Pícea y arce", accesorios: ["Estuche", "Arco", "Resina"] } },
  CHELO: { abrev: "Vc", base: { nombre: "Violonchelo", familia: "Cuerdas frotadas", marca: "Yamaha", modelo: "VC5S", medida: "4/4", material: "Pícea y arce", accesorios: ["Funda acolchada", "Arco", "Resina", "Pica"] } },
  CONTRABAJO: { abrev: "Cb", base: { nombre: "Contrabajo", familia: "Cuerdas frotadas", marca: "Palatino", modelo: "VB-004", medida: "3/4", material: "Laminado", accesorios: ["Funda", "Arco alemán"] } },
  ARPA: { abrev: "Ar", base: { nombre: "Arpa criolla", familia: "Cuerdas pulsadas", marca: "Artesanal", modelo: "32 cuerdas", material: "Cedro", accesorios: ["Funda", "Llave de afinación"] } },
  CUATRO: { abrev: "Cu", base: { nombre: "Cuatro", familia: "Cuerdas pulsadas", marca: "Artesanal", modelo: "Tradicional", material: "Pino y cedro", accesorios: ["Funda"] } },
  GUITARRA: { abrev: "Gu", base: { nombre: "Guitarra clásica", familia: "Cuerdas pulsadas", marca: "Yamaha", modelo: "C40", medida: "4/4", material: "Pícea", accesorios: ["Funda", "Afinador"] } },
  FLAUTA: { abrev: "Fl", base: { nombre: "Flauta traversa", familia: "Viento madera", marca: "Yamaha", modelo: "YFL-222", material: "Alpaca plateada", accesorios: ["Estuche", "Varilla de limpieza"] } },
  CLARINETE: { abrev: "Cl", base: { nombre: "Clarinete en Si bemol", familia: "Viento madera", marca: "Buffet Crampon", modelo: "E11", material: "Granadillo", accesorios: ["Estuche", "Boquilla", "Abrazadera", "Cañas (5)"] } },
  OBOE: { abrev: "Ob", base: { nombre: "Oboe", familia: "Viento madera", marca: "Fox", modelo: "Renard 330", material: "Resina", accesorios: ["Estuche", "Cañas (3)"] } },
  FAGOT: { abrev: "Fg", base: { nombre: "Fagot", familia: "Viento madera", marca: "Fox", modelo: "Renard 222D", material: "Arce", accesorios: ["Estuche", "Tudel", "Correa"] } },
  TROMPETA: { abrev: "Tp", base: { nombre: "Trompeta en Si bemol", familia: "Viento metal", marca: "Bach", modelo: "TR300H2", material: "Latón lacado", accesorios: ["Estuche", "Boquilla 7C", "Aceite de pistones"] } },
  CORNO: { abrev: "Cr", base: { nombre: "Corno francés", familia: "Viento metal", marca: "Yamaha", modelo: "YHR-567", material: "Latón amarillo", accesorios: ["Estuche", "Boquilla"] } },
  TROMBON: { abrev: "Tb", base: { nombre: "Trombón tenor", familia: "Viento metal", marca: "Jupiter", modelo: "JTB700", material: "Latón lacado", accesorios: ["Estuche", "Boquilla 6½AL"] } },
  TUBA: { abrev: "Tu", base: { nombre: "Tuba", familia: "Viento metal", marca: "Jupiter", modelo: "JTU1110", material: "Latón lacado", accesorios: ["Funda", "Boquilla"] } },
  TIMBAL: { abrev: "Ti", base: { nombre: "Timbal sinfónico", familia: "Percusión", marca: "Majestic", modelo: 'Prophonic 26"', medida: '26"', material: "Cobre", accesorios: ["Funda", "Llave de afinación"] } },
  REDOBLANTE: { abrev: "Re", base: { nombre: "Redoblante", familia: "Percusión", marca: "Pearl", modelo: "Export", medida: '14"', material: "Madera", accesorios: ["Funda", "Baquetas", "Atril"] } },
  PIANO: { abrev: "Pi", base: { nombre: "Piano vertical", familia: "Piano/Teclados", marca: "Yamaha", modelo: "U1", material: "Madera", accesorios: ["Banqueta", "Cubierta"] } },
  TECLADO: { abrev: "Te", base: { nombre: "Teclado digital", familia: "Piano/Teclados", marca: "Casio", modelo: "CDP-S110", medida: "88 teclas", accesorios: ["Soporte", "Pedal", "Adaptador"] } },
}

// [clave catálogo, estado, sede, condición, año]
const inventario: [string, Instrumento["estado"], string, Instrumento["condicion"], number][] = [
  ["VIOLIN", "comodato", "s1", "Buena", 2019],
  ["VIOLIN", "comodato", "s1", "Excelente", 2022],
  ["VIOLIN", "disponible", "s1", "Buena", 2019],
  ["VIOLIN34", "comodato", "s2", "Buena", 2020],
  ["VIOLIN34", "disponible", "s2", "Regular", 2017],
  ["VIOLIN", "reparacion", "s3", "Deteriorada", 2016],
  ["VIOLIN", "comodato", "s3", "Buena", 2021],
  ["VIOLA", "comodato", "s3", "Buena", 2020],
  ["VIOLA", "disponible", "s1", "Excelente", 2023],
  ["CHELO", "comodato", "s3", "Buena", 2018],
  ["CHELO", "disponible", "s2", "Buena", 2021],
  ["CHELO", "reparacion", "s3", "Regular", 2015],
  ["CONTRABAJO", "disponible", "s3", "Regular", 2014],
  ["CONTRABAJO", "comodato", "s2", "Buena", 2019],
  ["ARPA", "disponible", "s1", "Buena", 2021],
  ["CUATRO", "comodato", "s1", "Buena", 2022],
  ["CUATRO", "disponible", "s2", "Excelente", 2023],
  ["GUITARRA", "disponible", "s2", "Buena", 2020],
  ["FLAUTA", "comodato", "s1", "Excelente", 2023],
  ["FLAUTA", "disponible", "s2", "Buena", 2020],
  ["CLARINETE", "comodato", "s3", "Buena", 2021],
  ["CLARINETE", "disponible", "s1", "Buena", 2018],
  ["OBOE", "disponible", "s3", "Excelente", 2024],
  ["FAGOT", "reparacion", "s3", "Regular", 2013],
  ["TROMPETA", "comodato", "s2", "Buena", 2020],
  ["TROMPETA", "disponible", "s2", "Buena", 2020],
  ["CORNO", "comodato", "s3", "Excelente", 2022],
  ["TROMBON", "disponible", "s2", "Buena", 2019],
  ["TROMBON", "comodato", "s2", "Regular", 2016],
  ["TUBA", "disponible", "s3", "Buena", 2017],
  ["TIMBAL", "disponible", "s3", "Buena", 2018],
  ["TIMBAL", "reparacion", "s3", "Deteriorada", 2012],
  ["REDOBLANTE", "disponible", "s1", "Buena", 2021],
  ["PIANO", "disponible", "s3", "Buena", 2015],
  ["PIANO", "disponible", "s1", "Excelente", 2022],
  ["TECLADO", "comodato", "s1", "Buena", 2023],
]

function buildInstrumentos(): Instrumento[] {
  const contador: Record<string, number> = {}
  return inventario.map(([clave, estado, sedeId, condicion, anio], i) => {
    const { abrev, base } = catalogo[clave]
    contador[abrev] = (contador[abrev] ?? 0) + 1
    return {
      ...base,
      accesorios: [...base.accesorios],
      id: `i${i + 1}`,
      codigo: `${abrev}${String(contador[abrev]).padStart(3, "0")}-FOSC`,
      serial: `${base.marca.slice(0, 2).toUpperCase()}${(734251 + i * 7919).toString(36).toUpperCase()}`,
      anioAdquisicion: anio,
      condicion,
      estado,
      sedeId,
      observaciones:
        estado === "reparacion"
          ? ["Fisura en la tapa, en taller de luthería.", "Pistón trabado, en mantenimiento.", "Parche roto, pendiente de reemplazo.", "Llaves desajustadas, en taller."][i % 4]
          : undefined,
    }
  })
}

const integrantes: Integrante[] = [
  { id: "e1", cedula: "V-31.245.876", nombre: "María Alejandra Pérez Rodríguez", fechaNacimiento: "2009-03-14", telefono: "0414-412-3345", email: "maria.perez@correo.com", sedeId: "s1", catedra: "Violín", direccionFiscal: "Urb. La Viña, calle 132 N° 45-12, Valencia, Carabobo", representante: { nombre: "Carmen Rodríguez", cedula: "V-14.567.234", rif: "V-145672340", telefono: "0414-400-1122", parentesco: "Madre" } },
  { id: "e2", cedula: "V-30.987.112", nombre: "José Gregorio Hernández Díaz", fechaNacimiento: "2007-11-02", telefono: "0424-455-9087", email: "jose.hernandez@correo.com", sedeId: "s1", catedra: "Violín", direccionFiscal: "Prebo I, av. Los Nísperos N° 8, Valencia, Carabobo" },
  { id: "e3", cedula: "V-33.120.554", nombre: "Valentina Gómez Salas", fechaNacimiento: "2012-06-21", telefono: "0412-778-6521", email: "valen.gomez@correo.com", sedeId: "s2", catedra: "Violín", direccionFiscal: "Tarapío, calle 5 N° 22, Naguanagua, Carabobo", representante: { nombre: "Luis Gómez", cedula: "V-12.998.341", rif: "V-129983415", telefono: "0412-771-0090", parentesco: "Padre" } },
  { id: "e4", cedula: "V-29.654.330", rif: "V-296543302", nombre: "Andrés Eduardo Mendoza Rivas", fechaNacimiento: "2005-01-30", telefono: "0414-490-1276", email: "andres.mendoza@correo.com", sedeId: "s3", catedra: "Violín", direccionFiscal: "El Viñedo, av. Paseo Cabriales, res. Alba, Valencia" },
  { id: "e5", cedula: "V-31.876.002", nombre: "Camila Sofía Torres Blanco", fechaNacimiento: "2008-09-09", telefono: "0424-412-0033", email: "camila.torres@correo.com", sedeId: "s3", catedra: "Viola", direccionFiscal: "San José de Tarbes, calle 98 N° 14, Valencia", representante: { nombre: "Ana Blanco", cedula: "V-13.402.118", rif: "V-134021186", telefono: "0424-400-7788", parentesco: "Madre" } },
  { id: "e6", cedula: "V-28.443.901", rif: "V-284439017", nombre: "Luis Ángel Martínez Oropeza", fechaNacimiento: "2004-04-18", telefono: "0416-641-2290", email: "luis.martinez@correo.com", sedeId: "s3", catedra: "Violonchelo", direccionFiscal: "Los Guayos, sector Paraparal, casa 17, Carabobo", representante: { nombre: "Nelson Martínez", cedula: "V-9.880.441", rif: "V-098804412", telefono: "0416-640-0011", parentesco: "Padre" } },
  { id: "e7", cedula: "V-30.210.778", nombre: "Daniela Castillo Peña", fechaNacimiento: "2006-12-05", telefono: "0414-422-8765", email: "daniela.castillo@correo.com", sedeId: "s2", catedra: "Contrabajo", direccionFiscal: "La Esmeralda, calle 3 N° 40, San Diego, Carabobo" },
  { id: "e8", cedula: "V-32.554.119", nombre: "Sebastián Rojas Medina", fechaNacimiento: "2010-02-27", telefono: "0412-409-3301", email: "sebas.rojas@correo.com", sedeId: "s1", catedra: "Flauta traversa", direccionFiscal: "Trigal Norte, av. 140 N° 99-3, Valencia", representante: { nombre: "Patricia Medina", cedula: "V-15.330.908", rif: "V-153309081", telefono: "0412-400-2211", parentesco: "Madre" } },
  { id: "e9", cedula: "V-29.887.645", nombre: "Gabriela Suárez León", fechaNacimiento: "2005-08-13", telefono: "0424-477-0192", email: "gabriela.suarez@correo.com", sedeId: "s3", catedra: "Clarinete", direccionFiscal: "Naguanagua centro, calle Comercio N° 12, Carabobo" },
  { id: "e10", cedula: "V-31.009.874", nombre: "Diego Alejandro Ramírez Colmenares", fechaNacimiento: "2008-05-03", telefono: "0414-499-6620", email: "diego.ramirez@correo.com", sedeId: "s2", catedra: "Trompeta", direccionFiscal: "Rancho Grande, calle principal N° 7, Puerto Cabello", representante: { nombre: "Rosa Colmenares", cedula: "V-11.876.542", rif: "V-118765429", telefono: "0414-488-3310", parentesco: "Madre" } },
  { id: "e11", cedula: "V-30.556.013", nombre: "Isabella Vargas Quintero", fechaNacimiento: "2007-07-19", telefono: "0416-600-4512", email: "isabella.vargas@correo.com", sedeId: "s3", catedra: "Corno francés", direccionFiscal: "Mañongo, res. Los Robles, apto 5B, Naguanagua" },
  { id: "e12", cedula: "V-31.332.980", nombre: "Samuel Álvarez Páez", fechaNacimiento: "2009-10-10", telefono: "0424-431-7788", email: "samuel.alvarez@correo.com", sedeId: "s2", catedra: "Trombón", direccionFiscal: "Valle de Oro, calle 2 N° 31, San Diego, Carabobo", representante: { nombre: "Jorge Álvarez", cedula: "V-10.556.771", rif: "V-105567718", telefono: "0424-430-1111", parentesco: "Padre" } },
  { id: "e13", nombre: "Paola Andreína Morales Ugueto", fechaNacimiento: "2011-01-22", telefono: "0412-455-0909", email: "paola.morales@correo.com", sedeId: "s2", catedra: "Violín", direccionFiscal: "La Granja, calle 141 N° 20, Naguanagua, Carabobo", representante: { nombre: "Elena Ugueto", cedula: "V-14.009.332", rif: "V-140093325", telefono: "0412-450-8080", parentesco: "Madre" } },
  { id: "e14", cedula: "V-29.120.339", nombre: "Ricardo José Fernández Lugo", fechaNacimiento: "2005-03-08", telefono: "0414-401-5566", email: "ricardo.fernandez@correo.com", sedeId: "s3", catedra: "Oboe", direccionFiscal: "Los Mangos, av. 92 N° 44, Valencia, Carabobo" },
  { id: "e15", cedula: "V-30.774.221", nombre: "Andrea Carolina Silva Núñez", fechaNacimiento: "2006-09-27", telefono: "0414-433-2211", email: "andrea.silva@correo.com", sedeId: "s1", catedra: "Cuatro", direccionFiscal: "El Trigal, calle 148 N° 9, Valencia, Carabobo" },
  { id: "e16", cedula: "V-32.880.145", nombre: "Miguel Ángel Bracho Uzcátegui", fechaNacimiento: "2010-11-15", telefono: "0426-410-7733", email: "miguel.bracho@correo.com", sedeId: "s1", catedra: "Piano", direccionFiscal: "Av. Bolívar Norte, res. Camoruco, apto 11A, Valencia", representante: { nombre: "Yolanda Uzcátegui", cedula: "V-13.998.005", rif: "V-139980054", telefono: "0426-410-0099", parentesco: "Madre" } },
]

// [instrumentoId, integranteId, sede del préstamo, inicio (días), fin (días)]
const prestamos: [string, string, string, number, number][] = [
  ["i1", "e1", "s1", -200, 165],
  ["i2", "e2", "s1", -90, 12],
  ["i4", "e3", "s2", -150, 30],
  ["i7", "e4", "s3", -365, -5],
  ["i8", "e5", "s3", -60, 305],
  ["i10", "e6", "s3", -120, 245],
  ["i14", "e7", "s2", -45, 5],
  ["i16", "e15", "s1", -35, 330],
  ["i19", "e8", "s1", -30, 335],
  ["i21", "e9", "s3", -300, 65],
  ["i25", "e10", "s2", -180, -12],
  ["i27", "e11", "s3", -20, 345],
  ["i29", "e12", "s2", -100, 80],
  ["i36", "e16", "s1", -15, 350],
]

// Comodatos ya cerrados, para la pestaña "Historial".
// [instrumentoId, integranteId, sede, inicio (días), fin (días), archivado (días), motivo]
const archivados: [string, string, string, number, number, number, string][] = [
  ["i3", "e1", "s1", -700, -340, -335, "Creció y se le dio otro violín de 4/4."],
  ["i5", "e13", "s2", -600, -300, -298, "Devuelto en la recolección de diciembre."],
  ["i11", "e6", "s3", -800, -430, -425, "Se retiró del programa; instrumento devuelto completo."],
  ["i26", "e10", "s2", -540, -200, -196, "Cambio de cátedra: pasó a corno francés."],
]

function buildComodatos(): Comodato[] {
  const hoy = todayIso()
  const anio = hoy.slice(0, 4)
  const activos: Comodato[] = prestamos.map(([instrumentoId, integranteId, sedeId, ini, fin], i) => ({
    id: `c${i + 1}`,
    codigo: `CMD-${anio}-${String(i + 1).padStart(4, "0")}`,
    instrumentoId,
    integranteId,
    sedeId,
    fechaInicio: addDays(hoy, ini),
    fechaFin: addDays(hoy, fin),
    condicionEntrega: "Buena",
    creadoEn: addDays(hoy, ini),
  }))
  const cerrados: Comodato[] = archivados.map(([instrumentoId, integranteId, sedeId, ini, fin, arch, motivo], i) => ({
    id: `a${i + 1}`,
    codigo: `CMD-${Number(anio) - 1}-${String(i + 1).padStart(4, "0")}`,
    instrumentoId,
    integranteId,
    sedeId,
    fechaInicio: addDays(hoy, ini),
    fechaFin: addDays(hoy, fin),
    condicionEntrega: "Buena",
    creadoEn: addDays(hoy, ini),
    archivadoEn: addDays(hoy, arch),
    motivoArchivo: motivo,
  }))
  return [...activos, ...cerrados]
}

export function buildSeed(): Db {
  return {
    sedes: sedes.map((s) => ({ ...s })),
    instrumentos: buildInstrumentos(),
    integrantes: integrantes.map((e) => ({ ...e })),
    comodatos: buildComodatos(),
  }
}
