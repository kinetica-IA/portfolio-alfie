# Cuatro proyectos: fuentes y estado

Actualizado el 18 de noviembre de 2026. El portfolio presenta cuatro entregas de alcance delimitado en [kineticaai.com/lab/proyectos](https://www.kineticaai.com/lab/proyectos/).

| Caso | Fuente | Estado |
|---|---|---|
| Web | Este repositorio; src/content/ y src/data/portfolio.json | Astro/React publicado, índice y cuatro fichas accesibles. |
| Prompt Lab | [Repositorio independiente de Prompt Lab](https://github.com/kinetica-IA/prompt-lab); entrega pública v0.4 | v0.4 elegida por el usuario para su trabajo. Comparación de versiones cerrada. |
| Polar | [scripts/polar](scripts/polar/README.md) y artículo público | Estudio retrospectivo N-of-1; cinco variables conciliadas directamente desde export hasta CSV. |
| IO3/ALMA | [scripts/editorial](scripts/editorial/README.md) | Revisor editorial manual v1 derivado del aprendizaje de un prototipo histórico archivado. |

## Evidencia y límites

- Web: ocho páginas y cuatro descargas comprobadas HTTP 200 tras el despliegue del 18/11. Los textos aprobados y los artefactos estáticos coinciden con el build. No se han medido conversiones ni probado la entrega efectiva de mensajes.
- Prompt Lab: v0.4 fijada para uso del usuario; nueve casos de desarrollo activos tras retirar D06. Evaluaciones históricas, veredictos humanos y recomendaciones del asistente se conservan por separado. La selección de uso no afirma aceptación formal completa ni superioridad general. Reservados sin ejecutar.
- Polar: cinco variables conciliadas desde los exports: 216 valores RMSSD, 214 ANS, 214 recovery_sublevel, 218 sleep_wake_min y 225 sleep_interruptions. Valores y faltantes coinciden, sin discrepancias. La cobertura de retardos y los hashes enlazan con el entrenamiento publicado. No se certifica la ejecución histórica de los Parquet intermedios ni validez clínica o prospectiva.
- IO3/ALMA: doce pruebas de aceptación y uso sobre nueve Markdown reales. Cero avisos dentro de reglas limitadas no estima precisión ni falsos negativos. El programa nunca concede aprobación clínica ni permiso de publicación.

## Desarrollo y mantenimiento

[DESARROLLO-LOCAL.md](DESARROLLO-LOCAL.md) describe instalación y comandos portables. Las fichas públicas tienen una única fuente: src/data/portfolio.json. El estilo, las colecciones y el despliegue pertenecen a este repositorio.

Datos de salud, diarios, modelos personales y expedientes de auditoría permanecen fuera de este repositorio. Los archivos de prueba usan ejemplos sintéticos.

El cierre técnico/documental y las cuatro fichas públicas de esta fase están entregados. La siguiente actividad es usar y mostrar los casos, registrando necesidades concretas antes de abrir otra versión o estudio. Los resultados históricos son evidencia fechada, no nuevas órdenes de trabajo.
