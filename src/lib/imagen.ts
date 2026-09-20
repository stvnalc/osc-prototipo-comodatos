// Las fotos se guardan como data URL dentro de localStorage, así que hay que
// reducirlas antes. En el sistema real irían a `storage/app/public` vía Laravel
// y en la base de datos quedaría solo la ruta del archivo.

const MAX_LADO = 640
const CALIDAD = 0.72

export const TIPOS_IMAGEN = "image/jpeg,image/png,image/webp"

export async function comprimirImagen(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.")
  const bitmap = await createImageBitmap(file)
  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo procesar la imagen.")
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", CALIDAD)
}
