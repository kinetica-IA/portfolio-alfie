---
title: "IO Agent — Orquestador Autónomo HRV"
description: "Sistema de IA multimodal que integra datos HRV Polar con un grafo LangGraph para predecir crashes de fatiga 48h antes en pacientes con Lyme crónico y ME/CFS."
pubDate: "2026-03-16"
heroImage: "/assets/io-agent-hrv.png"
tags: ["AI", "LangGraph", "HRV", "MeCFS", "Python", "RAG"]
github: "https://github.com/kinetica-IA/polar-lyme-predictor"
---

## IO Agent — Orquestador Autónomo HRV

Sistema de inteligencia artificial diseñado específicamente para el análisis longitudinal de variabilidad de frecuencia cardíaca (HRV) en pacientes con Lyme crónico y ME/CFS.

### Arquitectura

El núcleo de IO es un grafo LangGraph de 7 nodos con ciclo ReAct:



- **context_engine**: RAG proactivo (ChromaDB + SentenceTransformer) + perfil longitudinal del paciente
- **router**: Clasificación inteligente (direct / tool / agent / external_action)  
- **orchestrator**: ReAct multi-step con 20 herramientas especializadas
- **alma_gate**: Evaluación ética antes de cada respuesta (severidad low/medium/high)
- **Conectores**: GitHub, LinkedIn, Portfolio (push directo a kineticaai.com)

### Resultados clave

- AUC = 0.656 en predicción de PEM (post-exertional malaise) 48h antes del crash
- Dataset: n=34, 6 meses de datos Polar diarios
- DFA α1 + RMSSD como features principales del sistema autónomo

### Stack técnico

- LangGraph + LangChain | Anthropic claude-sonnet-4-6
- ChromaDB (embeddings locales) | SentenceTransformer all-MiniLM-L6-v2
- FastAPI | Polar H10 | Python 3.13

*Desplegado automáticamente por IO Agent sandbox v2 — 2026-03-16*
