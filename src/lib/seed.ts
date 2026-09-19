import { addDays, todayIso } from "./format"
import type { Comodato, Db, Estudiante, Instrumento, Ubicacion } from "./types"

// Datos ficticios para la demo. Las fechas se calculan relativas a "hoy"
// para que siempre existan comodatos vigentes, por vencer y vencidos.

const ubicaciones: Ubicacion[] = [
  { id: "u1", sede: "Hesperia", direccion: "Av. Bolívar", espacio: "UJAP", detalle: "Depósito de instrumentos, piso 1" },
  { id: "u2", sede: "Valencia", direccion: "Av. Bolívar Norte", espacio: "Sede Principal OSC", detalle: "Almacén central" },
  { id: "u3", sede: "Naguanagua", direccion: "Av. Universidad", espacio: "Núcleo Bárbula", detalle: "Salón de cuerdas" },
  { id: "u4", sede: "San Diego", direccion: "Av. Don Julio Centeno", espacio: "Núcleo San Diego" },
  { id: "u5", sede: "Puerto Cabello", direccion: "Av. Juan José Flores", espacio: "Núcleo Puerto Cabello" },
]

type Base = Omit<Instrumento, "id" | "codigo" | "estado" | "ubicacionId" | "condicion" | "anioAdquisicion" | "serial">

const catalogo: Record<string, Base> = {
  VLN: { nombre: "Violín", familia: "Cuerdas", marca: "Yamaha", modelo: "V5SC", medida: "4/4", material: "Pícea y arce", accesorios: ["Estuche", "Arco", "Resina", "Hombrera"] },
  VLN34: { nombre: "Violín", familia: "Cuerdas", marca: "Stentor", modelo: "Student II", medida: "3/4", material: "Pícea y arce", accesorios: ["Estuche", "Arco", "Resina"] },
  VLA: { nombre: "Viola", familia: "Cuerdas", marca: "Cremona", modelo: "SVA-175", medida: '15.5"', material: "Pícea y arce", accesorios: ["Estuche", "Arco", "Resina"] },
  VCL: { nombre: "Violonchelo", familia: "Cuerdas", marca: "Yamaha", modelo: "VC5S", medida: "4/4", material: "Pícea y arce", accesorios: ["Funda acolchada", "Arco", "Resina", "Pica"] },
  CBJ: { nombre: "Contrabajo", familia: "Cuerdas", marca: "Palatino", modelo: "VB-004", medida: "3/4", material: "Laminado", accesorios: ["Funda", "Arco alemán"] },
  FLT: { nombre: "Flauta traversa", familia: "Maderas", marca: "Yamaha", modelo: "YFL-222", material: "Alpaca plateada", accesorios: ["Estuche", "Varilla de limpieza"] },
  CLR: { nombre: "Clarinete en Si bemol", familia: "Maderas", marca: "Buffet Crampon", modelo: "E11", material: "Granadillo", accesorios: ["Estuche", "Boquilla", "Abrazadera", "Cañas (5)"] },
  OBO: { nombre: "Oboe", familia: "Maderas", marca: "Fox", modelo: "Renard 330", material: "Resina", accesorios: ["Estuche", "Cañas (3)"] },
  FAG: { nombre: "Fagot", familia: "Maderas", marca: "Fox", modelo: "Renard 222D", material: "Arce", accesorios: ["Estuche", "Tudel", "Correa"] },
  TPT: { nombre: "Trompeta en Si bemol", familia: "Metales", marca: "Bach", modelo: "TR300H2", material: "Latón lacado", accesorios: ["Estuche", "Boquilla 7C", "Aceite de pistones"] },
  CRN: { nombre: "Corno francés", familia: "Metales", marca: "Yamaha", modelo: "YHR-567", material: "Latón amarillo", accesorios: ["Estuche", "Boquilla"] },
  TBN: { nombre: "Trombón tenor", familia: "Metales", marca: "Jupiter", modelo: "JTB700", material: "Latón lacado", accesorios: ["Estuche", "Boquilla 6½AL"] },
  TBA: { nombre: "Tuba", familia: "Metales", marca: "Jupiter", modelo: "JTU1110", material: "Latón lacado", accesorios: ["Funda", "Boquilla"] },
  TIM: { nombre: "Timbal sinfónico", familia: "Percusión", marca: "Majestic", modelo: "Prophonic 26\"", medida: '26"', material: "Cobre", accesorios: ["Funda", "Llave de afinación"] },
}

const prefijo = (k: string) => (k === "VLN34" ? "VLN" : k)

// [clave catálogo, estado, ubicación, condición, año]
const inventario: [string, Instrumento["estado"], string, Instrumento["condicion"], number][] = [
  ["VLN", "comodato", "u1", "Buena", 2019],
  ["VLN", "comodato", "u1", "Excelente", 2022],
  ["VLN", "disponible", "u1", "Buena", 2019],
  ["VLN34", "comodato", "u3", "Buena", 2020],
  ["VLN34", "disponible", "u3", "Regular", 2017],
  ["VLN", "reparacion", "u2", "Deteriorada", 2016],
  ["VLN", "comodato", "u2", "Buena", 2021],
  ["VLA", "comodato", "u2", "Buena", 2020],
  ["VLA", "disponible", "u1", "Excelente", 2023],
  ["VCL", "comodato", "u2", "Buena", 2018],
  ["VCL", "disponible", "u3", "Buena", 2021],
  ["VCL", "reparacion", "u2", "Regular", 2015],
  ["CBJ", "disponible", "u2", "Regular", 2014],
  ["CBJ", "comodato", "u4", "Buena", 2019],
  ["FLT", "comodato", "u1", "Excelente", 2023],
  ["FLT", "disponible", "u4", "Buena", 2020],
  ["CLR", "comodato", "u2", "Buena", 2021],
  ["CLR", "disponible", "u5", "Buena", 2018],
  ["OBO", "disponible", "u2", "Excelente", 2024],
  ["FAG", "reparacion", "u2", "Regular", 2013],
  ["TPT", "comodato", "u5", "Buena", 2020],
  ["TPT", "disponible", "u5", "Buena", 2020],
  ["CRN", "comodato", "u2", "Excelente", 2022],
  ["TBN", "disponible", "u4", "Buena", 2019],
  ["TBN", "comodato", "u4", "Regular", 2016],
  ["TBA", "disponible", "u2", "Buena", 2017],
  ["TIM", "disponible", "u2", "Buena", 2018],
  ["TIM", "reparacion", "u2", "Deteriorada", 2012],
]

function buildInstrumentos(): Instrumento[] {
  const contador: Record<string, number> = {}
  return inventario.map(([clave, estado, ubicacionId, condicion, anio], i) => {
    const p = prefijo(clave)
    contador[p] = (contador[p] ?? 0) + 1
    const base = catalogo[clave]
    return {
      ...base,
      accesorios: [...base.accesorios],
      id: `i${i + 1}`,
      codigo: `OSC-${p}-${String(contador[p]).padStart(3, "0")}`,
      serial: `${base.marca.slice(0, 2).toUpperCase()}${(734251 + i * 7919).toString(36).toUpperCase()}`,
      anioAdquisicion: anio,
      condicion,
      estado,
      ubicacionId,
      observaciones:
        estado === "reparacion"
          ? ["Fisura en la tapa, en taller de luthería.", "Pistón trabado, en mantenimiento.", "Parche roto, pendiente de reemplazo.", "Llaves desajustadas, en taller."][i % 4]
          : undefined,
    }
  })
}

const estudiantes: Estudiante[] = [
  { id: "e1", cedula: "V-31.245.876", nombres: "María Alejandra", apellidos: "Pérez Rodríguez", fechaNacimiento: "2009-03-14", telefono: "0414-412-3345", email: "maria.perez@correo.com", nucleo: "Núcleo Hesperia", catedra: "Violín", direccion: "Urb. La Viña, Valencia", representante: { nombre: "Carmen Rodríguez", cedula: "V-14.567.234", telefono: "0414-400-1122", parentesco: "Madre" } },
  { id: "e2", cedula: "V-30.987.112", nombres: "José Gregorio", apellidos: "Hernández Díaz", fechaNacimiento: "2007-11-02", telefono: "0424-455-9087", email: "jose.hernandez@correo.com", nucleo: "Núcleo Hesperia", catedra: "Violín", direccion: "Prebo I, Valencia" },
  { id: "e3", cedula: "V-33.120.554", nombres: "Valentina", apellidos: "Gómez Salas", fechaNacimiento: "2012-06-21", telefono: "0412-778-6521", email: "valen.gomez@correo.com", nucleo: "Núcleo Bárbula", catedra: "Violín", direccion: "Tarapío, Naguanagua", representante: { nombre: "Luis Gómez", cedula: "V-12.998.341", telefono: "0412-771-0090", parentesco: "Padre" } },
  { id: "e4", cedula: "V-29.654.330", nombres: "Andrés Eduardo", apellidos: "Mendoza Rivas", fechaNacimiento: "2005-01-30", telefono: "0414-490-1276", email: "andres.mendoza@correo.com", nucleo: "Sede Principal", catedra: "Violín", direccion: "El Viñedo, Valencia" },
  { id: "e5", cedula: "V-31.876.002", nombres: "Camila Sofía", apellidos: "Torres Blanco", fechaNacimiento: "2008-09-09", telefono: "0424-412-0033", email: "camila.torres@correo.com", nucleo: "Sede Principal", catedra: "Viola", direccion: "San José de Tarbes, Valencia", representante: { nombre: "Ana Blanco", cedula: "V-13.402.118", telefono: "0424-400-7788", parentesco: "Madre" } },
  { id: "e6", cedula: "V-28.443.901", nombres: "Luis Ángel", apellidos: "Martínez Oropeza", fechaNacimiento: "2004-04-18", telefono: "0416-641-2290", email: "luis.martinez@correo.com", nucleo: "Sede Principal", catedra: "Violonchelo", direccion: "Los Guayos, Carabobo" },
  { id: "e7", cedula: "V-30.210.778", nombres: "Daniela", apellidos: "Castillo Peña", fechaNacimiento: "2006-12-05", telefono: "0414-422-8765", email: "daniela.castillo@correo.com", nucleo: "Núcleo San Diego", catedra: "Contrabajo", direccion: "La Esmeralda, San Diego" },
  { id: "e8", cedula: "V-32.554.119", nombres: "Sebastián", apellidos: "Rojas Medina", fechaNacimiento: "2010-02-27", telefono: "0412-409-3301", email: "sebas.rojas@correo.com", nucleo: "Núcleo Hesperia", catedra: "Flauta traversa", direccion: "Trigal Norte, Valencia", representante: { nombre: "Patricia Medina", cedula: "V-15.330.908", telefono: "0412-400-2211", parentesco: "Madre" } },
  { id: "e9", cedula: "V-29.887.645", nombres: "Gabriela", apellidos: "Suárez León", fechaNacimiento: "2005-08-13", telefono: "0424-477-0192", email: "gabriela.suarez@correo.com", nucleo: "Sede Principal", catedra: "Clarinete", direccion: "Naguanagua centro" },
  { id: "e10", cedula: "V-31.009.874", nombres: "Diego Alejandro", apellidos: "Ramírez Colmenares", fechaNacimiento: "2008-05-03", telefono: "0414-499-6620", email: "diego.ramirez@correo.com", nucleo: "Núcleo Puerto Cabello", catedra: "Trompeta", direccion: "Rancho Grande, Puerto Cabello", representante: { nombre: "Rosa Colmenares", cedula: "V-11.876.542", telefono: "0414-488-3310", parentesco: "Madre" } },
  { id: "e11", cedula: "V-30.556.013", nombres: "Isabella", apellidos: "Vargas Quintero", fechaNacimiento: "2007-07-19", telefono: "0416-600-4512", email: "isabella.vargas@correo.com", nucleo: "Sede Principal", catedra: "Corno francés", direccion: "Mañongo, Naguanagua" },
  { id: "e12", cedula: "V-31.332.980", nombres: "Samuel", apellidos: "Álvarez Páez", fechaNacimiento: "2009-10-10", telefono: "0424-431-7788", email: "samuel.alvarez@correo.com", nucleo: "Núcleo San Diego", catedra: "Trombón", direccion: "Valle de Oro, San Diego", representante: { nombre: "Jorge Álvarez", cedula: "V-10.556.771", telefono: "0424-430-1111", parentesco: "Padre" } },
  { id: "e13", cedula: "V-32.001.456", nombres: "Paola Andreína", apellidos: "Morales Ugueto", fechaNacimiento: "2011-01-22", telefono: "0412-455-0909", email: "paola.morales@correo.com", nucleo: "Núcleo Bárbula", catedra: "Violín", direccion: "La Granja, Naguanagua", representante: { nombre: "Elena Ugueto", cedula: "V-14.009.332", telefono: "0412-450-8080", parentesco: "Madre" } },
  { id: "e14", cedula: "V-29.120.339", nombres: "Ricardo José", apellidos: "Fernández Lugo", fechaNacimiento: "2005-03-08", telefono: "0414-401-5566", email: "ricardo.fernandez@correo.com", nucleo: "Sede Principal", catedra: "Oboe", direccion: "Los Mangos, Valencia" },
]

// [instrumentoId, estudianteId, inicio (días desde hoy), fin (días desde hoy)]
const prestamos: [string, string, number, number][] = [
  ["i1", "e1", -200, 165],
  ["i2", "e2", -90, 12],
  ["i4", "e3", -150, 30],
  ["i7", "e4", -365, -5],
  ["i8", "e5", -60, 305],
  ["i10", "e6", -120, 245],
  ["i14", "e7", -45, 5],
  ["i15", "e8", -30, 335],
  ["i17", "e9", -300, 65],
  ["i21", "e10", -180, -12],
  ["i23", "e11", -20, 345],
  ["i25", "e12", -100, 80],
]

function buildComodatos(): Comodato[] {
  const hoy = todayIso()
  const anio = hoy.slice(0, 4)
  return prestamos.map(([instrumentoId, estudianteId, ini, fin], i) => ({
    id: `c${i + 1}`,
    numero: `CMD-${anio}-${String(i + 1).padStart(4, "0")}`,
    instrumentoId,
    estudianteId,
    fechaInicio: addDays(hoy, ini),
    fechaFin: addDays(hoy, fin),
    condicionEntrega: "Buena",
    creadoEn: addDays(hoy, ini),
  }))
}

export function buildSeed(): Db {
  return {
    ubicaciones: ubicaciones.map((u) => ({ ...u })),
    instrumentos: buildInstrumentos(),
    estudiantes: estudiantes.map((e) => ({ ...e })),
    comodatos: buildComodatos(),
  }
}
