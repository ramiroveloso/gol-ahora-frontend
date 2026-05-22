# Contexto del Proyecto: Gol Ahora

## Stack Tecnológico Local
- **Frontend:** React (Vite) + Tailwind CSS.
- **Backend:** Python (FastAPI + SQLModel) corriendo localmente en `http://localhost:8000`.
- **Base de Datos:** PostgreSQL (Relacional) `golahora_db`.

## Preferencias Estéticas y de UI (Mis Gustos)
- **Tema:** Dark Mode Premium nativo.
- **Paleta de Colores:** Fondo oscuro profundo (`#0b0f19`), tarjetas con bordes sutiles en gris nítido, y acentos/detalles de estado interactivos en **Verde Neón Deportivo** o **Azul Eléctrico** (estilo marcador de juego en tiempo real).
- **Usabilidad:** Los formularios extensos deben estar estructurados en secciones responsivas (pasos o cuadrículas limpias) para evitar fatiga visual.

## Reglas Críticas del Diagrama de Clases
- Los IDs se manejan como strings de tipo UUID en el frontend.
- [cite_start]**Registro de Usuarios:** Mapea campos individuales de localización (dirección, código postal, localidad, provincia, país) [cite: 135, 142-145]. El backend autogenera la fecha de creación, el ID y el estado activo.
- [cite_start]**Flujo de Reservas:** No se confirman reservas si el estado del pago no es exitoso[cite: 50, 198]. [cite_start]La duración máxima depende estrictamente del tipo de cancha (F5: 1h, F7: 1.5h, F11: 2h)[cite: 51].
## Reglas de Negocio Críticas (Backend y Base de Datos)
- [cite_start]**Validación de Reservas [RF-30, RF-34]:** El estado de una reserva inicia como 'Pendiente'[cite: 217]. [cite_start]Solo puede cambiar a 'Confirmada' si el estado del pago asociado en la tabla de cobros es 'Confirmado'[cite: 198]. [cite_start]No se permiten reservas pendientes de pago en producción[cite: 51].
- [cite_start]**Restricción de Tiempos por Cancha [RF-26]:** La duración máxima de una reserva depende estrictamente del tipo de cancha indicado en el diagrama[cite: 51]:
  - [cite_start]Fútbol 5: Máximo 1 hora[cite: 51].
  - [cite_start]Fútbol 7: Máximo 1.5 horas[cite: 51].
  - [cite_start]Fútbol 11: Máximo 2 horas[cite: 51].
- [cite_start]**Políticas de Cancelación y Penalización [RF-32, RF-82]:** Las cancelaciones deben realizarse con un mínimo de 6 horas de antelación al inicio del turno[cite: 53]. [cite_start]Si se cancela fuera de ese plazo, el sistema debe calcular automáticamente un monto de penalización en la tabla de cobros[cite: 54, 322].
- [cite_start]**Gestión de Cupos en Clases [RF-62]:** Cada entidad 'Clase' o 'Entrenamiento' tiene un atributo `cantidadMaximaAlumnos`[cite: 274]. [cite_start]El sistema debe validar que la cantidad de registros en la tabla intermedia `clases_alumnos` no exceda este límite[cite: 62].
- [cite_start]**Verificación Deportiva [RF-12, RF-54]:** Todo usuario con rol 'Profesor' o 'Entrenador' debe tener un registro asociado en la tabla `Certificado` con estado 'Vigente' para poder ser asignado a una clase[cite: 61, 166].
## Arquitectura de Relaciones UML (Estructura de Base de Datos)

### 1. Jerarquía de Herencia / Generalización (Estrategia: Joined Table Inheritance)
- [cite_start]**`Usuario` (Clase Madre/Base):** Contiene campos comunes de identidad y localización [cite: 132-138, 142-146]. De ella heredan de forma directa tres subclases:
  - **`Administrador`:** Añade `idEmpleado` y `nivelAccesso`. Tiene relación 1 a 1 de control sobre el sistema.
  - [cite_start]**`Cliente`:** Añade `fechaIngreso` e `historialReserva`[cite: 394].
  - [cite_start]**`Profesional`:** Añade `fechaIngreso`, `disponibilidad` y una lista de certificados [cite: 61, 91-92]. Es a su vez la clase madre de la cual heredan:
    - [cite_start]**`Profesor`:** Añade `especialidad` y opera sobre la clase `Clase`[cite: 38, 103].
    - [cite_start]**`Entrenador`:** Añade `categoria` y opera sobre la clase `Entrenamiento`[cite: 38].

### 2. Relaciones de Composición (Dependencia Fuerte / Ciclo de Vida Vinculado)
*Si la clase contenedora se elimina, las partes desaparecen de la base de datos (Cascade Delete).*
- [cite_start]**`Competencia` ──◆ `Fixture` (1 a 1):** Una competencia (Liga o Torneo) posee un único fixture para organizar sus partidos[cite: 36, 106]. El fixture no tiene sentido de existir sin su competencia madre.
- [cite_start]**`Fixture` ──◆ `Partido` (1 a Muchos):** El fixture se compone de múltiples partidos distribuidos en fechas [cite: 106-107].
- [cite_start]**`Cobro` ──◆ `DetalleDescuento` (1 a Muchos):** Un registro de cobro contiene los desgloses de los descuentos aplicados de forma automática o manual en esa transacción [cite: 112-113].
- [cite_start]**`Cobro` ──◆ `Recibo` (1 a 1):** Todo cobro genera de forma obligatoria un único recibo de pago para el usuario[cite: 43, 112].

### 3. Relaciones de Agregación (Asociación Todo-Parte Flexible)
*La parte puede existir de forma independiente en la base de datos aunque el contenedor se destruya.*
- [cite_start]**`Clase` ──◇ `Usuario` (Muchos a Muchos / N:M):** Una clase grupal o entrenamiento lista a múltiples alumnos inscritos[cite: 103, 274, 276]. En SQL se resuelve con la tabla intermedia `clase_alumno`.
- [cite_start]**`Equipo` ──◇ `Usuario` (Muchos a Muchos / N:M):** Los equipos inscritos a las ligas agrupan a múltiples usuarios (jugadores)[cite: 35, 105].
- [cite_start]**`Competencia` ──◇ `Equipo` (Muchos a Muchos / N:M):** Los torneos y ligas agrupan una lista de equipos competidores[cite: 35, 105].
- [cite_start]**`Profesional` ──◇ `Certificado` (1 a Muchos):** Un profesor o entrenador puede registrar y tener asociados múltiples certificados deportivos vigentes para validar su rol[cite: 61, 92].