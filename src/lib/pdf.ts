import { jsPDF } from "jspdf"
import { edad, formatDateLong, nombreCompleto, rutaUbicacion } from "./format"
import type { Comodato, Estudiante, Instrumento, Ubicacion } from "./types"

// Genera el contrato de comodato en el navegador. En el sistema real esto
// vive en el backend (p. ej. barryvdh/laravel-dompdf + vista Blade) para que
// el documento quede firmado por el servidor y no dependa del cliente.

const FUNDACION = "FUNDACIÓN ORQUESTA SINFÓNICA DE CARABOBO"
const RIF = "J-00000000-0" // TODO: RIF real de la fundación

async function logoPng(): Promise<string | null> {
  try {
    const img = new Image()
    img.src = "/brand/logo.webp"
    await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext("2d")?.drawImage(img, 0, 0)
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

export async function descargarContrato(opts: {
  comodato: Comodato
  instrumento: Instrumento
  estudiante: Estudiante
  ubicacion?: Ubicacion
}) {
  const { comodato: c, instrumento: i, estudiante: e, ubicacion } = opts
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const W = 210
  const M = 20
  const ancho = W - M * 2
  let y = 18

  const saltoSiHaceFalta = (alto: number) => {
    if (y + alto > 280) {
      doc.addPage()
      y = 20
    }
  }

  const parrafo = (texto: string, size = 10, estilo: "normal" | "bold" = "normal", gap = 2) => {
    doc.setFont("helvetica", estilo)
    doc.setFontSize(size)
    const lineas = doc.splitTextToSize(texto, ancho) as string[]
    const alto = lineas.length * size * 0.42
    saltoSiHaceFalta(alto)
    doc.text(lineas, M, y, { align: "justify", maxWidth: ancho })
    y += alto + gap
  }

  const clausula = (titulo: string, texto: string) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    saltoSiHaceFalta(10)
    doc.text(titulo, M, y)
    y += 4.5
    parrafo(texto, 10, "normal", 3)
  }

  // Encabezado
  const logo = await logoPng()
  if (logo) doc.addImage(logo, "PNG", M - 4, y - 8, 30, 30)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(FUNDACION, W - M, y, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(`RIF ${RIF}`, W - M, y + 5, { align: "right" })
  doc.text(`Contrato N° ${c.numero}`, W - M, y + 10, { align: "right" })
  doc.setTextColor(0)
  y += 26

  doc.setDrawColor(199, 174, 31)
  doc.setLineWidth(0.8)
  doc.line(M, y, W - M, y)
  y += 10

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("CONTRATO DE COMODATO DE INSTRUMENTO MUSICAL", W / 2, y, { align: "center" })
  y += 10

  const menor = edad(e.fechaNacimiento) < 18
  const rep = e.representante
  const comodatario = menor && rep
    ? `${rep.nombre.toUpperCase()}, venezolano(a), mayor de edad, titular de la cédula de identidad N° ${rep.cedula}, actuando en su carácter de ${rep.parentesco.toLowerCase()} y representante legal del (de la) estudiante ${nombreCompleto(e).toUpperCase()}, titular de la cédula de identidad N° ${e.cedula}`
    : `${nombreCompleto(e).toUpperCase()}, venezolano(a), titular de la cédula de identidad N° ${e.cedula}, domiciliado(a) en ${e.direccion}`

  parrafo(
    `Entre la ${FUNDACION}, inscrita bajo el RIF ${RIF}, quien en lo sucesivo se denominará "EL COMODANTE", por una parte; y por la otra, ${comodatario}, estudiante de la cátedra de ${e.catedra} adscrito(a) al ${e.nucleo}, quien en lo sucesivo se denominará "EL COMODATARIO", se ha convenido celebrar el presente contrato de comodato, de conformidad con lo previsto en el Código Civil venezolano, el cual se regirá por las siguientes cláusulas:`,
    10,
    "normal",
    5
  )

  clausula(
    "PRIMERA. OBJETO.",
    "EL COMODANTE entrega en calidad de préstamo de uso gratuito a EL COMODATARIO el instrumento musical que se describe a continuación, para ser utilizado exclusivamente en las actividades formativas y artísticas de la Orquesta Sinfónica de Carabobo:"
  )

  // Ficha del instrumento
  const filas: [string, string][] = [
    ["Código de inventario", i.codigo],
    ["Instrumento", `${i.nombre}${i.medida ? ` (${i.medida})` : ""}`],
    ["Marca / Modelo", `${i.marca} ${i.modelo}`],
    ["Serial", i.serial],
    ["Condición al entregar", c.condicionEntrega],
    ["Accesorios", i.accesorios.join(", ") || "Ninguno"],
    ["Ubicación de resguardo", rutaUbicacion(ubicacion)],
  ]
  saltoSiHaceFalta(filas.length * 7 + 4)
  doc.setFontSize(9.5)
  filas.forEach(([k, v], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(246, 244, 236)
      doc.rect(M, y - 4.6, ancho, 7, "F")
    }
    doc.setFont("helvetica", "bold")
    doc.text(k, M + 3, y)
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(v, ancho - 60)[0] as string, M + 58, y)
    y += 7
  })
  y += 4

  clausula(
    "SEGUNDA. DURACIÓN.",
    `El presente comodato tendrá vigencia desde el ${formatDateLong(c.fechaInicio)} hasta el ${formatDateLong(c.fechaFin)}, fecha en la cual EL COMODATARIO deberá restituir el instrumento, salvo que las partes acuerden por escrito su renovación.`
  )
  clausula(
    "TERCERA. USO Y CONSERVACIÓN.",
    "EL COMODATARIO se obliga a usar el instrumento con el debido cuidado, conservarlo en su estuche o funda, protegerlo de la humedad, el calor y los golpes, y presentarlo para revisión cuando EL COMODANTE lo solicite."
  )
  clausula(
    "CUARTA. PROHIBICIONES.",
    "Queda expresamente prohibido a EL COMODATARIO ceder, prestar, alquilar, vender o empeñar el instrumento, así como realizarle reparaciones o modificaciones sin autorización previa y por escrito de EL COMODANTE."
  )
  clausula(
    "QUINTA. DAÑOS Y PÉRDIDA.",
    "EL COMODATARIO responderá por los daños, pérdida o hurto del instrumento que ocurran por su culpa o negligencia, debiendo notificar a EL COMODANTE de inmediato cualquier incidente. El desgaste natural por el uso normal no será imputable a EL COMODATARIO."
  )
  clausula(
    "SEXTA. DEVOLUCIÓN Y TERMINACIÓN ANTICIPADA.",
    "EL COMODANTE podrá solicitar la devolución anticipada del instrumento en caso de incumplimiento de cualquiera de las cláusulas, retiro del estudiante del programa o necesidad justificada de la institución. El instrumento se devolverá con todos sus accesorios, en el estado en que fue recibido, salvo el desgaste natural."
  )
  if (c.observaciones) clausula("SÉPTIMA. OBSERVACIONES.", c.observaciones)

  parrafo(
    `Se hacen dos (2) ejemplares de un mismo tenor y a un solo efecto, en Valencia, estado Carabobo, el ${formatDateLong(c.fechaInicio)}.`,
    10,
    "normal",
    4
  )

  // Firmas
  const firmas = menor && rep
    ? ["Por EL COMODANTE", "Representante legal", "Estudiante"]
    : ["Por EL COMODANTE", "EL COMODATARIO"]
  saltoSiHaceFalta(34)
  y += 20
  const col = ancho / firmas.length
  doc.setFontSize(9)
  firmas.forEach((f, idx) => {
    const x = M + col * idx + 6
    doc.setDrawColor(60)
    doc.setLineWidth(0.3)
    doc.line(x, y, x + col - 12, y)
    doc.setFont("helvetica", "bold")
    doc.text(f, x + (col - 12) / 2, y + 5, { align: "center" })
    doc.setFont("helvetica", "normal")
    const sub = idx === 0 ? "Nombre, firma y sello" : idx === 1 && menor && rep ? `C.I. ${rep.cedula}` : `C.I. ${e.cedula}`
    doc.text(sub, x + (col - 12) / 2, y + 9.5, { align: "center" })
  })

  // Pie
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setFontSize(7.5)
    doc.setTextColor(140)
    doc.text("Documento generado por el prototipo del Sistema de Inventario OSC - modelo sujeto a revisión legal.", M, 290)
    doc.text(`Página ${p} de ${paginas}`, W - M, 290, { align: "right" })
    doc.setTextColor(0)
  }

  doc.save(`${c.numero}_${i.codigo}.pdf`)
}
