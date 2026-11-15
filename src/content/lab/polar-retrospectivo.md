---
title: "Polar: análisis retrospectivo de métricas y síntomas"
slug: polar-retrospectivo
summary: "Un registro personal, cinco modelos exploratorios y una evaluación temporal reproducible. Resultados, límites y código, sin publicar el diario ni las series individuales."
kind: n-of-1
date: 2026-11-15
---

## Qué estoy estudiando

Busco relaciones entre las métricas de mi reloj Polar y mis puntuaciones de síntomas. Rellenaba el diario al levantarme, con horario estable y antes de consultar el reloj. El análisis se hace después sobre esos registros: eso no significa que las entradas del diario se reconstruyeran retrospectivamente.

Este trabajo es una autoobservación de una persona. No permite atribuir causas, generalizar a otras personas o decidir un tratamiento. Tampoco es una calculadora de riesgo para quien visita esta web.

## Qué he vuelto a entrenar

He entrenado cinco clasificadores exploratorios sobre 61 fechas emparejadas entre métricas y diario. Para el objetivo autonómico hay 55 registros utilizables, porque no relleno puntuaciones ausentes con valores inventados.

La entrada del modelo está fijada antes de ver estos resultados: RMSSD de Polar, ANS status, recovery sublevel, minutos despierto e interrupciones de sueño, cada uno en la fecha del diario y el día anterior. Son diez variables. No busco entre muchas combinaciones para publicar la que mejor encaje.

Los objetivos son severidad global, fatiga, malestar postesfuerzo, niebla mental y síntomas autonómicos. Conservo los umbrales de los modelos históricos: 6 para severidad y fatiga, 5 para los otros tres, sobre escalas de 0 a 10. Son decisiones de este análisis, no puntos de corte diagnósticos validados.

Uso regresión logística regularizada con parámetros fijos. Excluyo las métricas HRV calculadas desde PPI agregado por día: su ventana nocturna todavía necesita reconstruirse. Los agregados históricos usados aquí tampoco se han vuelto a generar íntegramente desde el export bruto.

## Cómo separo ajuste y evaluación

Después de los primeros 30 registros disponibles de cada objetivo, ajusto el modelo con la historia anterior y evalúo el registro siguiente. Repito ese avance por fecha, sin mezclar aleatoriamente pasado y futuro. Las filas no se tratan como días consecutivos: el diario tiene huecos.

La mediana para completar variables y el escalado se calculan dentro de cada historia de entrenamiento. No uso el registro reservado para calcularlos. La referencia simple estima la probabilidad a partir de la proporción de positivos en esa misma historia. El ajuste final con todos los registros se guarda aparte y no sustituye esta evaluación.

Esta es una comprobación secuencial sobre datos históricos. No es un estudio prospectivo ni una validación clínica.

## Resultados de esta ejecución

Ejecución del 15 de noviembre de 2026. Cada fila resume registros evaluados después del bloque inicial de entrenamiento. «+ / −» indica cuántos superan o no el umbral del objetivo. En Brier, un valor menor indica menos error probabilístico; comparo el modelo con su referencia histórica.

<div role="region" aria-label="Resultados agregados del análisis Polar" tabindex="0" style="overflow-x:auto;margin:24px 0;">
<table style="width:100%;min-width:600px;border-collapse:collapse;font-variant-numeric:tabular-nums;">
<thead><tr><th scope="col" style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;color:var(--teal);">Objetivo</th><th scope="col" style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;color:var(--teal);">Evaluados</th><th scope="col" style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;color:var(--teal);">+ / −</th><th scope="col" style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;color:var(--teal);">AUROC</th><th scope="col" style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;color:var(--teal);">Brier: modelo / referencia</th></tr></thead>
<tbody>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">Severidad global</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">31</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">18 / 13</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.744</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.211 / 0.249</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">Fatiga</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">31</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">20 / 11</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.645</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.251 / 0.237</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">Malestar postesfuerzo</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">31</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">20 / 11</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.732</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.210 / 0.236</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">Niebla mental</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">31</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">30 / 1</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.967 *</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.031 / 0.041</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">Síntomas autonómicos</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">25</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">14 / 11</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.695</td><td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;">0.239 / 0.253</td></tr>
</tbody>
</table>
</div>

\* En niebla mental hay 30 positivos y un solo negativo. No interpreto esa AUROC como una estimación estable de discriminación. Mostrar una cifra alta sin ese denominador daría una impresión equivocada.

El modelo de fatiga tiene un Brier peor que la referencia simple en esta evaluación. Las mejoras observadas en otros objetivos no demuestran por sí solas utilidad clínica ni que el patrón vaya a repetirse. No selecciono el mejor objetivo como resultado general del proyecto.

## Qué sigue sin resolverse

Hay pocos registros, una sola persona y dependencia temporal entre observaciones. Se exploran cinco objetivos y no presento pruebas de significación ni intervalos que supongan observaciones independientes. Los datos que faltan pueden cambiar la muestra, pero no atribuyo su ausencia a una causa sin comprobarla.

La hora de escritura histórica del diario no tiene una marca independiente verificable. La fecha de un commit indica incorporación a Git, no cuándo escribí originalmente una entrada. La alineación por fecha de sueño se ha revisado; todavía falta completar la trazabilidad desde las señales brutas hasta todos los agregados.

Los resultados no son directamente comparables con las antiguas AUC de selección de variables y LOO: han cambiado las entradas y la evaluación. Los informes históricos se conservan como antecedentes, no como una certificación de estos modelos.

## Código y trazabilidad

El análisis se ha preparado con asistencia de IA y comprobaciones de código. Cinco tests sintéticos verifican, entre otros puntos, que los datos reservados no entran en el preprocesamiento, que la evaluación respeta el orden de fechas y que el resultado público no contiene filas personales.

Puedes consultar el [resumen agregado de esta ejecución](/data/polar-retrospective-summary.json) y el [código, tests y versiones de dependencias](https://github.com/kinetica-IA/portfolio-alfie/tree/main/scripts/polar). No publico el diario, las notas, las series diarias ni los parámetros personales de los modelos.

Para el aislamiento del preprocesamiento uso los criterios de la documentación oficial de scikit-learn sobre [fuga de datos](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage) y [Pipeline](https://scikit-learn.org/stable/modules/generated/sklearn.pipeline.Pipeline.html). Esas referencias explican la implementación; no validan el diseño ni los resultados de este caso.
