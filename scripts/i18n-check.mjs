// Extrae las claves i18n usadas en src/ y las compara con el diccionario.
// Uso: npm run i18n:check  → sale con código 1 si hay faltantes.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(f)) out.push(p)
  }
  return out
}

const files = walk(ROOT)
const dictFiles = files.filter((f) => /[\\/]i18n[\\/]/.test(f))
const dictKeys = new Set()
for (const f of dictFiles) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/^\s*'([\w.]+)':\s*\[/gm)) dictKeys.add(m[1])
}
const namespaces = new Set([...dictKeys].map((k) => k.split('.')[0]))

const used = new Map() // key -> file
const dynamic = new Map() // prefix -> file
for (const f of files) {
  if (dictFiles.includes(f)) continue
  const src = readFileSync(f, 'utf8')
  // t('a.b') / tr('a.b', ...) / t("a.b")
  for (const m of src.matchAll(/\b(?:t|tr)\(\s*['"]([\w.]+)['"]/g)) used.set(m[1], f)
  // literales tipo 'ns.clave' cuyo namespace existe en el diccionario (labels de config)
  for (const m of src.matchAll(/['"]([a-zA-Z]+(?:\.[\w]+)+)['"]/g)) {
    const k = m[1]
    if (namespaces.has(k.split('.')[0]) && !/\.(tsx?|css|js|svg|png|csv|demo|com)$/.test(k)) used.set(k, f)
  }
  // dinámicas: t(`ns.${x}`)
  for (const m of src.matchAll(/\b(?:t|tr)\(\s*`([\w.]*)\$\{/g)) dynamic.set(m[1], f)
}

const missing = [...used.keys()].filter((k) => !dictKeys.has(k)).sort()
const dynMissing = [...dynamic.keys()].filter((p) => ![...dictKeys].some((k) => k.startsWith(p)))

console.log(`Diccionario: ${dictKeys.size} claves · usadas (estáticas): ${used.size} · prefijos dinámicos: ${dynamic.size}`)
if (missing.length || dynMissing.length) {
  for (const k of missing) console.log(`  ✗ falta "${k}"  (${used.get(k).replace(ROOT, 'src/')})`)
  for (const p of dynMissing) console.log(`  ✗ prefijo dinámico sin claves "${p}*"  (${dynamic.get(p).replace(ROOT, 'src/')})`)
  console.log(`Faltantes: ${missing.length + dynMissing.length}`)
  process.exit(1)
}
console.log('Faltantes: 0 ✓')
