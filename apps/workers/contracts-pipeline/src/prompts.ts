/**
 * Extraction prompts — mirror the crm-new reference subtasks (primary,
 * secondary, artistas) plus the per-contract NL-query analysis and synthesis.
 * All prompts mention "json" explicitly (DeepSeek JSON-mode requirement).
 */

export const PRIMARY_KEYS = [
  "tituloContrato",
  "involucrados",
  "nombreGrupo",
  "fechaInicio",
  "fechaFin",
  "esPosibleExpandirlo",
  "tiempoExtensionPosible",
  "tiempoExtensionMeses",
  "estatusContrato",
  "tipoContrato",
  "periodoColeccion",
  "descripcionPeriodoColeccion",
  "duracionPeriodoColeccion",
  "periodoRetencion",
  "descripcionPeriodoRetencion",
  "duracionPeriodoRetencion",
  "resumenGeneral",
];

export const primaryPrompt = (fileName: string, extractedText: string, currentDateIso: string) => `
Extrae la información clave de este contrato y responde en json con las claves indicadas.
El título del archivo es: ${fileName}
1. "tituloContrato": Nombre del contrato.
2. "involucrados": Lista de nombres de todos los involucrados (array de strings).
3. "nombreGrupo": Si se especifica un grupo, banda o colectivo al que pertenece el involucrado, su nombre.
4. "fechaInicio": Fecha de inicio en formato AAAA-MM-DD; si solo está el año usa AAAA-01-01.
5. "fechaFin": Fecha de finalización en formato AAAA-MM-DD; si no está especificada déjala vacía.
6. "esPosibleExpandirlo": Si el contrato puede extenderse (SI, NO, NO_ESPECIFICADO).
7. "tiempoExtensionPosible": El tiempo de extensión textual (ej. "2 años", "6 meses").
8. "tiempoExtensionMeses": El tiempo de extensión normalizado a meses como número entero (ej. 2 años -> 24); null si no aplica.
9. "estatusContrato": VIGENTE, FINALIZADO o NO_ESPECIFICADO, basado en la fecha actual: ${currentDateIso}.
10. "tipoContrato": Uno de: ARRENDAMIENTOS, ALQUILERES, VEHICULOS, SERVICIOS, ARTISTAS.
11. "periodoColeccion": Si existe un período de colección (SI, NO, NO_ESPECIFICADO).
12. "descripcionPeriodoColeccion": Cómo funciona el período de colección.
13. "duracionPeriodoColeccion": Duración del período de colección.
14. "periodoRetencion": Si existe un período de retención (SI, NO, NO_ESPECIFICADO).
15. "descripcionPeriodoRetencion": Cómo funciona el período de retención.
16. "duracionPeriodoRetencion": Duración del período de retención.
17. "resumenGeneral": SIEMPRE genera un resumen del contrato en español.
Este es el contrato:
${extractedText}
`;

export const SECONDARY_KEYS = ["testigos", "clausulaRenovacion", "esNotariado"];

export const secondaryPrompt = (fileName: string, extractedText: string) => `
Extrae la siguiente información de este contrato y responde en json con las claves indicadas.
El título del archivo es: ${fileName}
1. "testigos": Lista con los nombres de los testigos del contrato, si existen (array de strings).
2. "clausulaRenovacion": La cláusula de renovación del contrato citada textualmente, si existe.
3. "esNotariado": Si el contrato es notariado (true o false).
Este es el contrato:
${extractedText}
`;

export const ARTISTS_KEYS = ["artistas"];

export const artistsPrompt = (extractedText: string, existingTags: string[] = []) => `
Extrae los artistas de este contrato y responde en json con la clave "artistas" (array de strings).
El nombre de los artistas se identifica porque se les denomina como EL ARTISTA.
${
  existingTags.length > 0
    ? `ETIQUETAS DE ARTISTAS YA EXISTENTES EN EL SISTEMA:
${existingTags.map((tag) => `- ${tag}`).join("\n")}

REGLA IMPORTANTE: si un artista del contrato corresponde a una etiqueta existente — aunque el nombre esté escrito distinto (mayúsculas, con o sin segundos nombres/apellidos, alias o nombre artístico) — devuelve EXACTAMENTE el texto de la etiqueta existente en lugar de una variante nueva. Solo devuelve un nombre nuevo cuando el artista no corresponda a ninguna etiqueta existente.
`
    : ""
}Este es el contrato:
${extractedText}
`;

export const QUERY_ANALYSIS_KEYS = ["coincide", "confianza", "razon", "fechaInicio", "fechaFin", "fechaFinFinal", "artistas"];

export const queryAnalysisPrompt = (
  fileName: string,
  extractedText: string,
  userQuery: string,
  currentDateIso: string,
  currentYear: number
) => `
Eres un analista legal. Analiza si este contrato coincide con la petición del usuario y responde en json.
PETICIÓN: "${userQuery}"
Fecha actual: ${currentDateIso} (año en curso: ${currentYear})
Archivo: ${fileName}
Claves de la respuesta:
1. "coincide": true/false — si el contrato coincide con la petición. Considera cláusulas de extensión automática: un contrato con fin 2025 y extensión automática de 5 años termina efectivamente en 2030.
2. "confianza": número de 0 a 100.
3. "razon": explicación breve en español.
4. "fechaInicio" y "fechaFin": AAAA-MM-DD si se conocen.
5. "fechaFinFinal": fecha de finalización EFECTIVA considerando extensiones, AAAA-MM-DD.
6. "artistas": array de strings con los artistas del contrato.
Este es el contrato:
${extractedText}
`;

export const SYNTHESIS_KEYS = ["resumen", "contractIdsSeleccionados"];

export const synthesisPrompt = (userQuery: string, currentDateIso: string, currentYear: number, candidateList: unknown) => `
Eres un analista legal. Recibiste el resultado del análisis individual de varios contratos frente a esta petición del usuario:
PETICIÓN: "${userQuery}"
Fecha actual: ${currentDateIso} (año en curso: ${currentYear})
A continuación están los contratos candidatos (ya pre-filtrados como posibles coincidencias):
${JSON.stringify(candidateList, null, 2)}
Tu tarea (responde en json):
1. Revisa la coherencia de cada candidato con la petición y descarta los que claramente NO deberían incluirse (falsos positivos).
2. "contractIdsSeleccionados": array con los ids (strings) de los contratos que SÍ coinciden.
3. "resumen": resumen ejecutivo en español del resultado global (cuántos coinciden, criterios usados, observaciones sobre extensiones o vencimientos).
`;
