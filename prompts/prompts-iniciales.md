# Prompts iniciales - Modulo 10 Frontend - JCO

## Contexto General

Estoy trabajando en el repositorio `AI4Devs-frontend-202602-Seniors`, una aplicacion LTI full-stack con React en `/frontend` y Express/Prisma en `/backend`.

El ejercicio del modulo 10 pide crear la interfaz `position`: una vista de detalle para una posicion concreta donde se visualicen y gestionen los candidatos en un tablero kanban. La pagina debe:

- Mostrar el titulo de la posicion.
- Incluir una flecha para volver al listado `/positions`.
- Crear una columna por fase del proceso de entrevista.
- Situar cada candidato en la columna correspondiente.
- Mostrar nombre completo y puntuacion media en cada tarjeta.
- Permitir mover candidatos entre fases con drag and drop.
- Adaptarse correctamente a movil, con columnas apiladas a ancho completo.

Tambien quiero aplicar los aprendizajes de la revision del modulo anterior:

- Prompts mas elaborados y secuenciales.
- Contratos JSON explicitos para request/response.
- Edge cases y errores esperados definidos antes de implementar.
- Uso de `applicationId` para evitar actualizaciones ambiguas cuando un candidato participa en varias posiciones.
- Ordenar las columnas del kanban por `interviewStep.orderIndex`, no por ids accidentales.
- Validar que la etapa destino pertenece al flujo de entrevistas de la posicion.
- Ejecutar `npm run build` como gate de calidad antes de entregar.

## Contratos API esperados

### GET `/positions/:id/interviewFlow`

Respuesta esperada:

```json
{
  "positionName": "Senior Full-Stack Engineer",
  "interviewFlow": {
    "id": 1,
    "description": "Standard development interview process",
    "interviewSteps": [
      {
        "id": 1,
        "interviewFlowId": 1,
        "interviewTypeId": 1,
        "name": "Initial Screening",
        "orderIndex": 1
      }
    ]
  }
}
```

Nota de compatibilidad: el backend real del repo devuelve este contrato envuelto como `{ "interviewFlow": { ... } }` desde `/position/:id/interviewflow`.

### GET `/positions/:id/candidates`

Respuesta esperada:

```json
[
  {
    "id": 1,
    "applicationId": 1,
    "fullName": "John Doe",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 5
  }
]
```

`applicationId` debe usarse para identificar la candidatura concreta. No se debe asumir que `candidateId` es suficiente, porque el mismo candidato puede estar en varias posiciones.

### PUT `/candidates/:id/stage`

Request esperado:

```json
{
  "applicationId": 1,
  "currentInterviewStep": 3
}
```

Respuesta esperada:

```json
{
  "message": "Candidate stage updated successfully",
  "data": {
    "id": 1,
    "positionId": 1,
    "candidateId": 1,
    "applicationDate": "2024-06-04T13:34:58.304Z",
    "currentInterviewStep": 3,
    "notes": null,
    "interviews": []
  }
}
```

Nota de compatibilidad: el backend real del repo expone `PUT /candidates/:id`, asi que el frontend debe intentar el contrato del enunciado y usar el endpoint real como fallback.

## Prompt 1 - Analisis del frontend y backend existentes

```text
Actua como senior frontend engineer en una aplicacion LTI de recruiting.

Antes de implementar, analiza el repo y contesta:

1. Que archivo monta la aplicacion React real:
   - Verifica si `index.tsx` resuelve `App.tsx` o `App.js`.
   - Si existen ambos, identifica cual esta usando Create React App.

2. Que existe ya para `/positions`:
   - Componente actual.
   - Datos mock o API real.
   - Filtros disponibles.
   - Comportamiento actual del boton "Ver proceso".

3. Que endpoints reales expone el backend:
   - Rutas de `positionRoutes.ts`.
   - Rutas de `candidateRoutes.ts`.
   - Diferencias entre el enunciado y el codigo real.

4. Que entidades de dominio participan:
   - `Position`
   - `Application`
   - `Candidate`
   - `InterviewStep`
   - `Interview`

5. Riesgos de dominio:
   - Un candidato puede tener varias aplicaciones.
   - La actualizacion de etapa debe identificar `applicationId`.
   - Las columnas deben ordenarse por `orderIndex`.
   - No se debe crear una etapa inexistente ni mover a una fase de otro flujo.

No modifiques codigo todavia.
Devuelve:
- resumen de hallazgos,
- archivos a tocar,
- plan de implementacion,
- comandos de validacion.
```

## Prompt 2 - Implementacion de la ruta `/position/:positionId`

```text
Implementa la interfaz de detalle de posicion para el ejercicio del modulo 10.

Requisitos de routing:
- La ruta debe ser `/position/:positionId`.
- Desde `/positions`, el boton "Ver proceso" de cada tarjeta debe navegar a `/position/{id}`.
- La ruta principal y `/add-candidate` no deben romperse.
- Si el proyecto usa `App.js` aunque exista `App.tsx`, actualiza ambos o asegura que el archivo resuelto por el bundler tenga la ruta nueva.

Requisitos de datos:
- Cargar en paralelo:
  - flujo de entrevistas de la posicion,
  - candidatos de la posicion.
- Soportar el contrato del enunciado:
  - `GET /positions/:id/interviewFlow`
  - `GET /positions/:id/candidates`
  - `PUT /candidates/:id/stage`
- Soportar tambien los endpoints reales del repo como fallback:
  - `GET /position/:id/interviewflow`
  - `GET /position/:id/candidates`
  - `PUT /candidates/:id`

Requisitos de UI:
- Mostrar titulo de la posicion.
- Mostrar flecha para volver a `/positions`.
- Renderizar tablero kanban con una columna por `interviewStep`.
- Ordenar columnas por `orderIndex` y luego por `id`.
- Mostrar por columna el nombre de la fase y numero de candidatos.
- Mostrar tarjetas con:
  - iniciales del candidato,
  - `fullName`,
  - `applicationId`,
  - `averageScore`.
- Mostrar metricas de resumen:
  - total candidatos,
  - total fases,
  - puntuacion media.
- Debe ser responsive:
  - columnas horizontales en desktop,
  - columnas apiladas ocupando todo el ancho en mobile.

Requisitos de interaccion:
- Usar drag and drop nativo de HTML5, sin nuevas dependencias.
- Al soltar una tarjeta en otra columna:
  - actualizar optimistamente la UI,
  - enviar `{ applicationId, currentInterviewStep: step.id }`,
  - refrescar datos tras exito,
  - revertir estado si falla la API.
- Si el usuario suelta en la misma columna, no llamar al backend.

Estados y errores:
- Loading mientras carga la posicion.
- Alert de error si falla la API.
- Estado vacio en columnas sin candidatos.
- No usar datos demo: si el backend falla, debe mostrarse el error real.
```

## Prompt 3 - Ajuste visual y experiencia de usuario

```text
Mejora la presentacion de la pagina `/position/:positionId` sin cambiar la logica de negocio.

Objetivo:
Que la interfaz deje de verse como Bootstrap basico y parezca una herramienta de recruiting profesional.

Directrices:
- Cabecera tipo dashboard con fondo blanco, sombra sutil y jerarquia clara.
- Boton de volver con affordance visual clara.
- Metric cards para candidatos, fases y score medio.
- Columnas kanban diferenciadas con header, contador y area de drop.
- Tarjetas de candidato con avatar de iniciales, application id y score destacado.
- Paleta sobria y profesional, sin landing page ni textos explicativos innecesarios.
- No introducir librerias nuevas.
- Mantener contraste, espaciado y responsive.
- Verificar que `App.css` se importa desde el archivo `App` realmente usado por el bundler.
```

## Prompt 4 - Validacion final antes de PR

```text
Revisa la implementacion como code reviewer antes de abrir PR.

Comprueba:
- `npm run build` compila sin errores.
- `/positions` renderiza y el boton "Ver proceso" navega a `/position/1`.
- `/position/1` carga datos reales del backend cuando `localhost:3010` esta disponible.
- No hay datos demo en la vista final.
- CORS permite trabajar desde `http://localhost:3000` y `http://127.0.0.1:3000`.
- El drag/drop usa `applicationId` para la aplicacion concreta.
- Las columnas se ordenan por `orderIndex`.
- El estado optimista revierte si falla el PUT.
- Los prompts incluyen contratos JSON, edge cases y errores esperados.

Devuelve:
- resumen de cambios,
- archivos tocados,
- resultado de validacion,
- riesgos residuales si los hay.
```

## Orden de Ejecucion Recomendado

1. Ejecutar Prompt 1 para entender estructura, rutas y contratos reales.
2. Ejecutar Prompt 2 para implementar comportamiento funcional.
3. Ejecutar Prompt 3 para pulir la UI.
4. Levantar backend y frontend localmente.
5. Ejecutar Prompt 4 y corregir hallazgos.
6. Validar con `npm run build`.

## Notas

- En el entorno local use PostgreSQL temporal y seed equivalente al `prisma/seed.ts` para comprobar la vista con API real.
- El cambio de CORS en backend evita falsos negativos cuando el navegador abre `127.0.0.1:3000` pero el backend esperaba solo `localhost:3000`.
- No se introduce ninguna dependencia nueva para el kanban.
