# Polar — benchmark retrospectivo

Este código produce el análisis de `/lab/polar-retrospectivo`. No descarga datos,
no publica en la web y no ejecuta los clasificadores legacy.

Python 3.13; versiones de paquetes en requirements.txt. Datos personales no incluidos.
Ejemplo con archivos propios fuera de un repositorio público:

```sh
python train_retrospective.py --daily /ruta/privada/daily_unified.csv --diary /ruta/privada/diary_live.csv --output /ruta/privada/resultados --analysis-date AAAA-MM-DD
python test_train_retrospective.py
```

El directorio de salida contiene `public-summary.json` (agregados) y
`private-models-and-provenance.json` (parámetros, fechas de evaluación y hashes de
inputs). **No publicar el segundo archivo.** Cada ejecución requiere revisar que
el contenido agregado sea adecuado para compartir; el script no da consentimiento
de publicación de datos de otras personas.

Configuración fijada: cinco familias de variables, retardos de calendario 0/1,
cinco targets y umbrales históricos, LogisticRegression C=0.5 balanced, sin búsqueda
de variables o hiperparámetros. Mediana y escalado solo sobre entrenamiento.
Evaluación por historia creciente después de 30 observaciones, mínimo 3 ejemplos
de cada clase; fallos y omisiones explícitos. La última observación evaluada no
entra en el entrenamiento que la evalúa. El ajuste final completo es independiente
del cálculo de métricas.

Esto es exploración retrospectiva N-of-1. No acredita causalidad, generalización,
diagnóstico ni validación prospectiva. Los agregados de origen necesitan aún
completar su trazabilidad a las señales brutas. No proporciona un servicio clínico.
