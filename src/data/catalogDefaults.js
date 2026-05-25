/** Datos base para modo demo (alineados al backend Django cuando exista integración). */

const profile = (extra = {}) => ({
  telefono: '',
  direccion: '',
  localidad: 'Ezpeleta',
  provincia: 'Buenos Aires',
  codigoPostal: '1884',
  memberSince: 'Mayo 2026',
  ...extra,
})

export const DEFAULT_COURTS = [
  {
    id: 'court-1',
    name: 'Camp Nou Synthetic',
    type: 'Fútbol 11',
    turf: 'Césped Sintético',
    roofed: false,
    pricePerHour: 45,
    maxDurationMinutes: 120,
    rating: '4.9',
    icon: 'sports_soccer',
    disponible: true,
  },
  {
    id: 'court-2',
    name: 'Sintética Pro',
    type: 'Fútbol 7',
    turf: 'Césped Sintético A1',
    roofed: false,
    pricePerHour: 35,
    maxDurationMinutes: 90,
    rating: '4.8',
    icon: 'grass',
    disponible: true,
  },
  {
    id: 'court-3',
    name: 'La Bombonera Techada',
    type: 'Fútbol 5',
    turf: 'Césped Sintético',
    roofed: true,
    pricePerHour: 30,
    maxDurationMinutes: 60,
    rating: '4.7',
    icon: 'roofing',
    disponible: true,
  },
  {
    id: 'court-4',
    name: 'Maracaná Arena',
    type: 'Fútbol 5',
    turf: 'Parquet Profesional',
    roofed: true,
    pricePerHour: 28,
    maxDurationMinutes: 60,
    rating: '4.6',
    icon: 'domain',
    disponible: false,
  },
]

export const DEFAULT_PROFESSORS = [
  {
    id: 'p1',
    name: 'Pro Fesional',
    email: 'profesional@gol.com',
    telefono: '11-5555-0101',
    certificacion: 'CONMEBOL B',
    alumnosCount: 12,
    activo: true,
  },
  {
    id: 'p2',
    name: 'María González',
    email: 'maria.gonzalez@gol.com',
    telefono: '11-5555-0102',
    certificacion: 'ATFA Nivel 2',
    alumnosCount: 8,
    activo: true,
  },
  {
    id: 'p3',
    name: 'Carlos Entrenador',
    email: 'carlos.train@gol.com',
    telefono: '11-5555-0103',
    certificacion: 'PF Licencia A',
    alumnosCount: 15,
    activo: true,
  },
]

export const DEMO_USERS = [
  {
    id: 'u1',
    name: 'Demo Cliente',
    email: 'demo@golahora.com',
    role: 'cliente',
    ...profile({ telefono: '11-4444-1001', direccion: 'Av. Mitre 1200' }),
  },
  {
    id: 'u2',
    name: 'Pro Fesional',
    email: 'profesional@gol.com',
    role: 'profesional',
    certificacionVigente: true,
    ...profile({ telefono: '11-4444-1002', localidad: 'Berazategui' }),
  },
  {
    id: 'u3',
    name: 'Admin Sistema',
    email: 'admin@gol.com',
    role: 'administrador',
    ...profile({ telefono: '11-4444-1003', direccion: 'Calle Admin 1' }),
  },
  {
    id: 'u4',
    name: 'Test Rapido',
    email: 'a@a.com',
    role: 'cliente',
    ...profile({ telefono: '11-0000-0000' }),
  },
]
