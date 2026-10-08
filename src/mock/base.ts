import type { Campana, Segmento, Vendedor } from './types'

export const NOW = Date.now()
export const MIN = 60_000
export const HOUR = 60 * MIN
export const DAY = 24 * HOUR

/** mulberry32 — generador determinístico con seed fija */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const vendedores: Vendedor[] = [
  { id: 'v1', nombre: 'Daniela Rojas', avatar: 'DR', color: '#22d3ee', bdc: 'BDC Norte', activo: true, email: 'daniela@camposcrm.demo', ultimoAcceso: NOW - 3 * MIN },
  { id: 'v2', nombre: 'Carlos Ibáñez', avatar: 'CI', color: '#60a5fa', bdc: 'BDC Sur', activo: true, email: 'carlos@camposcrm.demo', ultimoAcceso: NOW - 12 * MIN },
  { id: 'v3', nombre: 'Valeria Méndez', avatar: 'VM', color: '#a78bfa', bdc: 'BDC Norte', activo: true, email: 'valeria@camposcrm.demo', ultimoAcceso: NOW - 40 * MIN },
  { id: 'v4', nombre: 'Kevin Brooks', avatar: 'KB', color: '#f87171', bdc: 'BDC Sur', activo: true, email: 'kevin@camposcrm.demo', ultimoAcceso: NOW - 5 * HOUR },
  { id: 'v5', nombre: 'Andrés Salazar', avatar: 'AS', color: '#34d399', bdc: 'BDC Norte', activo: true, email: 'andres@camposcrm.demo', ultimoAcceso: NOW - 25 * MIN },
  { id: 'v6', nombre: 'Ashley Turner', avatar: 'AT', color: '#f59e0b', bdc: 'BDC Sur', activo: true, email: 'ashley@camposcrm.demo', ultimoAcceso: NOW - 2 * HOUR },
  { id: 'v7', nombre: 'Luis Fernández', avatar: 'LF', color: '#fb7185', bdc: 'BDC Norte', activo: true, email: 'luis@camposcrm.demo', ultimoAcceso: NOW - 55 * MIN },
  { id: 'v8', nombre: 'Mariana Ortiz', avatar: 'MO', color: '#2dd4bf', bdc: 'BDC Sur', activo: true, email: 'mariana@camposcrm.demo', ultimoAcceso: NOW - 18 * MIN },
]

export const DANIELA_ID = 'v1'
export const KEVIN_ID = 'v4'
export const VALERIA_ID = 'v3'

export const vendedorById = (id: string | null | undefined) => vendedores.find((v) => v.id === id)

/** Perfil de comportamiento usado por el generador (el relato de la demo). */
export interface Perfil {
  medianaMin: number
  sigma: number
  pAgenda: number
  pShow: number
  pCierre: number
  margen: number
  pSinResp: number
  peso: number
}

export const perfiles: Record<string, Perfil> = {
  v1: { medianaMin: 6, sigma: 0.55, pAgenda: 0.47, pShow: 0.84, pCierre: 0.45, margen: 0.118, pSinResp: 0.04, peso: 1.18 },
  v2: { medianaMin: 8, sigma: 0.6, pAgenda: 0.43, pShow: 0.82, pCierre: 0.41, margen: 0.106, pSinResp: 0.06, peso: 1.12 },
  v3: { medianaMin: 6, sigma: 0.55, pAgenda: 0.41, pShow: 0.8, pCierre: 0.12, margen: 0.071, pSinResp: 0.05, peso: 1.0 },
  v4: { medianaMin: 125, sigma: 0.5, pAgenda: 0.24, pShow: 0.74, pCierre: 0.3, margen: 0.093, pSinResp: 0.32, peso: 1.0 },
  v5: { medianaMin: 12, sigma: 0.65, pAgenda: 0.33, pShow: 0.79, pCierre: 0.3, margen: 0.098, pSinResp: 0.1, peso: 0.95 },
  v6: { medianaMin: 15, sigma: 0.65, pAgenda: 0.31, pShow: 0.78, pCierre: 0.3, margen: 0.091, pSinResp: 0.12, peso: 0.95 },
  v7: { medianaMin: 11, sigma: 0.6, pAgenda: 0.33, pShow: 0.8, pCierre: 0.31, margen: 0.1, pSinResp: 0.09, peso: 0.95 },
  v8: { medianaMin: 13, sigma: 0.6, pAgenda: 0.34, pShow: 0.8, pCierre: 0.3, margen: 0.097, pSinResp: 0.1, peso: 0.9 },
}

export const campanas: Campana[] = [
  { id: 'c1', nombre: 'FB · SUV Tax Refund', origen: 'facebook', gasto: 14500, activa: true, anuncios: ['Video testimonio RAV4', 'Carrusel SUVs 2024'] },
  { id: 'c2', nombre: 'FB · $0 Down Payment', origen: 'facebook', gasto: 11800, activa: true, anuncios: ['Imagen "$0 down"', 'Reel aprobación rápida'] },
  { id: 'c3', nombre: 'Google · Toyota Camry 2024', origen: 'google', gasto: 9200, activa: true, anuncios: ['Search "camry 2024 miami"', 'Performance Max'] },
  { id: 'c4', nombre: 'Google · Pickups F-150', origen: 'google', gasto: 7400, activa: true, anuncios: ['Search "f-150 for sale"', 'YouTube pickups'] },
  { id: 'c5', nombre: 'Marketplace · Usados certificados', origen: 'marketplace', gasto: 2600, activa: true, anuncios: ['Publicaciones destacadas'] },
  { id: 'c6', nombre: 'Web · Formulario de crédito', origen: 'web', gasto: 1900, activa: true, anuncios: ['Landing pre-aprobación'] },
]

/** probabilidad de que un lead de la campaña califique */
export const calidadCampana: Record<string, number> = {
  c1: 0.5, c2: 0.27, c3: 0.63, c4: 0.56, c5: 0.38, c6: 0.6, walkin: 0.86, referido: 0.82,
}

export const vehiculos: { nombre: string; segmento: Segmento; precio: number }[] = [
  { nombre: 'Toyota Camry 2024', segmento: 'sedan', precio: 29500 },
  { nombre: 'Toyota Camry 2021', segmento: 'usado', precio: 22900 },
  { nombre: 'Honda CR-V 2024', segmento: 'suv', precio: 34800 },
  { nombre: 'Honda Civic 2022', segmento: 'usado', precio: 21500 },
  { nombre: 'Nissan Rogue 2024', segmento: 'suv', precio: 31200 },
  { nombre: 'Ford F-150 2023', segmento: 'pickup', precio: 46900 },
  { nombre: 'Chevrolet Equinox 2024', segmento: 'suv', precio: 29900 },
  { nombre: 'Hyundai Tucson 2024', segmento: 'suv', precio: 30500 },
  { nombre: 'Jeep Grand Cherokee 2022', segmento: 'usado', precio: 36400 },
  { nombre: 'Kia Sportage 2024', segmento: 'suv', precio: 28700 },
  { nombre: 'Toyota RAV4 2023', segmento: 'usado', precio: 30900 },
  { nombre: 'Chevrolet Silverado 2022', segmento: 'pickup', precio: 41500 },
  { nombre: 'Nissan Altima 2023', segmento: 'sedan', precio: 25400 },
  { nombre: 'Toyota Tacoma 2024', segmento: 'pickup', precio: 39800 },
]

export const nombres = [
  'José', 'María', 'Luis', 'Ana', 'Carlos', 'Gabriela', 'Miguel', 'Sofía', 'Jorge', 'Lucía', 'Ricardo', 'Paola',
  'Fernando', 'Camila', 'Diego', 'Isabel', 'Alejandro', 'Natalia', 'Rafael', 'Daniel', 'Marisol', 'Héctor', 'Yesenia', 'Óscar',
  'Michael', 'Jennifer', 'David', 'Ashley', 'James', 'Brittany', 'Robert', 'Amanda', 'Chris', 'Nicole', 'Tyler', 'Samantha',
  'Brandon', 'Megan', 'Anthony', 'Stephanie', 'Kevin', 'Lauren', 'Jessica', 'Justin',
]
export const apellidos = [
  'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores',
  'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Cruz', 'Morales', 'Ortiz', 'Gutiérrez', 'Castillo', 'Vargas', 'Romero', 'Herrera',
  'Medina', 'Aguilar', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor',
  'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis',
]
