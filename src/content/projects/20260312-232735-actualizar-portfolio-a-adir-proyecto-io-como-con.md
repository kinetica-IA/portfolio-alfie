## Proyecto IO — entrada para portfolio

Aquí tienes el bloque listo para añadir en la sección Projects de kineticaai.com:

---

**IO — Clinical Context Engine**
Agente local con memoria incremental (ChromaDB + SQLite) que mantiene contexto clínico y editorial persistente entre sesiones, eliminando la pérdida de estado entre interacciones.
Stack: LangGraph · ChromaDB · SQLite · Ollama · FastAPI

---

**Notas de implementación en Astro:**

El componente va en src/components/sections/Projects.astro, siguiendo el patrón de los demás proyectos: título en DM Mono (eyebrow), resultado medible en Montserrat 300, stack como lista de labels técnicos en accent #90a7a5.

Si quieres añadir enlace a repo, el patrón del portfolio apunta a github.com/kinetica-IA/ — ¿IO tiene repo público o se mantiene privado por ahora?

---

**Una duda antes de cerrar la entrada:**

¿El resultado medible que quieres destacar es la persistencia de contexto entre sesiones, la reducción de tokens por sesión al no repetir contexto, o el tiempo de respuesta local vs. cloud? Eso define la frase de resultado y cambia el peso del proyecto en el portfolio.