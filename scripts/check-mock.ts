import { leadsIniciales } from '../src/mock/leads'
import { ranking, statsCampanas } from '../src/lib/metrics'
import { vendedores } from '../src/mock/base'
const { filas, equipo } = ranking(leadsIniciales, { rango: '30d' })
const f = (n: number) => n.toFixed(1)
console.log('total', leadsIniciales.length, 'asignados', equipo.asignados, 'vel', f(equipo.velMediana), 'agenda', f(equipo.tasaAgenda), 'cierre', f(equipo.tasaCierreCitas), 'ventas', equipo.ventas, 'cashMes', equipo.cashMes)
for (const r of filas) console.log(r.posicion, vendedores.find(v=>v.id===r.vendedorId)!.nombre.padEnd(16), r.asignados, 'vel', f(r.velMediana), 'ag', f(r.tasaAgenda), 'ci', f(r.tasaCierreCitas), 'v', r.ventas, 'mg', f(r.margen), 'resp', f(r.tasaRespuesta), r.brecha, 'sinC', r.sinContactar)
for (const c of statsCampanas(leadsIniciales)) console.log(c.nombre.padEnd(30), c.leads, c.calificados, f(c.tasaCalif), c.ventas, f(c.roi))
