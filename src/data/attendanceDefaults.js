/** Clases y alumnos demo — alineado a bookings.ClaseEntrenamiento + Asistencia */

export const DEFAULT_CLASSES = [
  {
    id: 'class-1',
    profesorEmail: 'profesional@gol.com',
    name: 'Fútbol Avanzado',
    sport: 'Fútbol 11',
    schedule: 'Lunes y Miércoles 19:00',
    time: '19:00 - 20:30',
    maxStudents: 12,
    certificacionRequerida: true,
    students: [
      { id: 's1', name: 'Renzo Ramírez', email: 'rramirez@example.com', present: true },
      { id: 's2', name: 'Juan Manuel Dávalos', email: 'jmdavalos@example.com', present: false },
      { id: 's3', name: 'Florencia Benítez', email: 'flor.b@example.com', present: true },
      { id: 's4', name: 'Carlos Tévez', email: 'apache@example.com', present: true },
      { id: 's5', name: 'Mateo Messi', email: 'mateo.messi@example.com', present: false },
    ],
  },
  {
    id: 'class-2',
    profesorEmail: 'profesional@gol.com',
    name: 'Entrenamiento Funcional',
    sport: 'Funcional',
    schedule: 'Martes 18:00',
    time: '18:00 - 19:30',
    maxStudents: 8,
    certificacionRequerida: true,
    students: [
      { id: 's6', name: 'Agustín Almendra', email: 'almendra@example.com', present: true },
      { id: 's7', name: 'Sofía Martínez', email: 'sofia.m@example.com', present: true },
      { id: 's8', name: 'Franco Armani', email: 'pulpo@example.com', present: false },
    ],
  },
  {
    id: 'class-3',
    profesorEmail: 'profesional@gol.com',
    name: 'Táctica Fútbol 5',
    sport: 'Fútbol 5',
    schedule: 'Sábado 10:00',
    time: '10:00 - 11:30',
    maxStudents: 10,
    certificacionRequerida: true,
    students: [
      { id: 's1', name: 'Renzo Ramírez', email: 'rramirez@example.com', present: true },
      { id: 's9', name: 'Luis Advíncula', email: 'rayo@example.com', present: true },
      { id: 's10', name: 'Marcos Rojo', email: 'capitan@example.com', present: true },
    ],
  },
]
