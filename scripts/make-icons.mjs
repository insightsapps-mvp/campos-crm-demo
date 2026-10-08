// Genera public/icon-192.png y public/icon-512.png (ícono Gauge sobre cuadro azul) sin dependencias.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4)
  c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}

function icon(size) {
  const px = Buffer.alloc(size * (size * 4 + 1))
  const cx = size / 2
  const cy = size * 0.56
  const R = size * 0.3
  const stroke = size * 0.07
  const rad = size * 0.22
  for (let y = 0; y < size; y++) {
    px[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const i = y * (size * 4 + 1) + 1 + x * 4
      // fondo #09090b y cuadro redondeado azul (con margen para maskable)
      let [r, g, b] = [9, 9, 11]
      const m = size * 0.08
      const qx = Math.max(m + rad - x, 0, x - (size - m - rad))
      const qy = Math.max(m + rad - y, 0, y - (size - m - rad))
      if (Math.hypot(qx, qy) <= rad) [r, g, b] = [59, 130, 246]
      // arco del gauge (de 200° a 340°, abierto abajo)
      const dx = x - cx
      const dy = y - cy
      const d = Math.hypot(dx, dy)
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI
      const enArco = ang <= 20 || ang >= 160 ? !(ang > 20 && ang < 160) && dy < size * 0.12 : true
      if (Math.abs(d - R) < stroke / 2 && (dy < 0 || Math.abs(dx) > R * 0.75) && enArco) [r, g, b] = [255, 255, 255]
      // aguja hacia arriba-derecha
      const nx = Math.cos(-Math.PI / 4)
      const ny = Math.sin(-Math.PI / 4)
      const t = dx * nx + dy * ny
      const perp = Math.abs(dx * ny - dy * nx)
      if (t > -stroke * 0.3 && t < R * 0.75 && perp < stroke / 2) [r, g, b] = [255, 255, 255]
      if (d < stroke * 0.75) [r, g, b] = [255, 255, 255]
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
      px[i + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(px)), chunk('IEND', Buffer.alloc(0))])
}

for (const s of [192, 512]) writeFileSync(new URL(`../public/icon-${s}.png`, import.meta.url), icon(s))
console.log('icons ok')
