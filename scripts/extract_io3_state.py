#!/usr/bin/env python3
"""extract_io3_state.py — Genera io3_state.json desde el codigo fuente de IO3."""

import json, re, os
from pathlib import Path
from datetime import datetime, timezone

IO3 = Path("/Users/alfonsonavarro/IO3")
OUT = Path("/Users/alfonsonavarro/portfolio-alfie/public/data/io3_state.json")


def _rx(file, pattern, group=1, default="[NO ENCONTRADO]"):
    """Extract first regex match from file."""
    try:
        text = (IO3 / file).read_text()
        m = re.search(pattern, text)
        return m.group(group) if m else default
    except FileNotFoundError:
        return default


def _rx_all(file, pattern, group=1):
    """Extract all regex matches from file."""
    try:
        text = (IO3 / file).read_text()
        return re.findall(pattern, text)
    except FileNotFoundError:
        return []


def _json_key(file, *keys):
    """Read nested JSON key."""
    try:
        d = json.loads((IO3 / file).read_text())
        for k in keys:
            d = d[k]
        return d
    except Exception:
        return "[NO ENCONTRADO]"


def _count_files(subdir):
    """Count all files recursively."""
    p = IO3 / subdir
    return len([f for f in p.rglob("*") if f.is_file()]) if p.is_dir() else 0


def _list_dir(subdir, ext=None):
    """List file names in directory."""
    p = IO3 / subdir
    if not p.is_dir():
        return []
    files = sorted(p.iterdir())
    if ext:
        files = [f for f in files if f.suffix == ext]
    return [f.name for f in files if f.is_file()]


def main():
    state = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "io3_path": str(IO3),

        "models": {
            "loop": _rx("shared/providers/registry.py", r'HAIKU\s*=\s*"([^"]+)"'),
            "synthesis": _rx("shared/providers/registry.py", r'SONNET\s*=\s*"([^"]+)"'),
        },

        "graph": {
            "node_count": len(_rx_all("agents/loop/graph.py",
                                       r'builder\.add_node\("([^"]+)"')),
            "node_names": _rx_all("agents/loop/graph.py",
                                   r'builder\.add_node\("([^"]+)"'),
        },

        "alma": {
            "axioms": _rx_all("shared/safety/alma/alma2.md",
                               r'\d+\.\s+\*\*(\w+)\*\*'),
            "l2_threshold_high": float(_rx(
                "shared/safety/alma/alma_l2_deterministic.py",
                r'COSINE_THRESHOLD_HIGH\s*=\s*([\d.]+)', default="0")),
            "l2_threshold_medium": float(_rx(
                "shared/safety/alma/alma_l2_deterministic.py",
                r'COSINE_THRESHOLD_MEDIUM\s*=\s*([\d.]+)', default="0")),
            "l2_gray_zone": float(_rx(
                "shared/safety/alma/alma_l2_deterministic.py",
                r'COSINE_GRAY_ZONE\s*=\s*([\d.]+)', default="0")),
            "risk_categories": _rx_all(
                "shared/safety/alma/alma_l2_deterministic.py",
                r'    "([a-z_]+)":\s*\['),
        },

        "rag": {
            "embed_model": _rx("shared/config.py",
                                r'EMBED_MODEL\s*=.*?,\s*"([^"]+)"\)'),
            "top_k": int(_rx("shared/config.py",
                              r'RAG_TOP_K\s*=.*?"(\d+)"', default="0")),
            "min_score": float(_rx("shared/config.py",
                                    r'RAG_MIN_SCORE\s*=.*?"([\d.]+)"',
                                    default="0")),
            "collections": _rx_all("shared/context/rag_retriever.py",
                                    r'_COLLECTION\s*=\s*"([^"]+)"'),
        },

        "classifier": {
            "task_types": [t for t in _rx_all("nodes/classify.py",
                                               r'return\s+"([a-z_]+)"')
                           if t not in ("clinical", "professional", "general")],
            "domains": [d for d in _rx_all("nodes/classify.py",
                                            r'return\s+"([a-z_]+)"')
                        if d in ("clinical", "professional", "general")],
        },

        "ui": {
            "react": _json_key("ui/frontend/package.json",
                                "dependencies", "react"),
            "vite": _json_key("ui/frontend/package.json",
                               "devDependencies", "vite"),
            "sse_events": _rx_all("ui/server.py",
                                   r'"type":\s*"([^"]+)"'),
        },

        "clinical_rules_count": len(_rx_all(
            "config/clinical_rules.yaml", r'-\s+rule:')),
        "msu_files": _list_dir("shared/msus", ext=".md"),
        "knowledge_file_count": _count_files("shared/knowledge"),

        "python_deps": [],

        "latency_documented": _rx("README.md",
                                   r'~(\d+)s.*?total', default=None),
    }

    # Python deps from pyproject.toml
    try:
        toml_text = (IO3 / "pyproject.toml").read_text()
        # Find the dependencies block between first [ and matching ]
        in_deps = False
        dep_lines = []
        for line in toml_text.splitlines():
            if re.match(r'^dependencies\s*=\s*\[', line):
                in_deps = True
                # Capture anything on the same line after [
                dep_lines.append(line.split("[", 1)[1])
                continue
            if in_deps:
                dep_lines.append(line)
                if re.match(r'^\s*\]', line):
                    break
        dep_block = "\n".join(dep_lines)
        state["python_deps"] = re.findall(r'"([^"]+)"', dep_block)
    except Exception:
        pass

    # Endpoints as list of {method, path}
    try:
        server_text = (IO3 / "ui/server.py").read_text()
        state["ui"]["endpoints"] = [
            {"method": m.upper(), "path": p}
            for m, p in re.findall(r'@app\.(get|post)\("([^"]+)"', server_text)
        ]
    except FileNotFoundError:
        state["ui"]["endpoints"] = []

    # Deduplicate SSE events
    state["ui"]["sse_events"] = list(dict.fromkeys(state["ui"]["sse_events"]))

    # Deduplicate task types and domains
    state["classifier"]["task_types"] = list(
        dict.fromkeys(state["classifier"]["task_types"]))
    state["classifier"]["domains"] = list(
        dict.fromkeys(state["classifier"]["domains"]))

    # ChromaDB chunk count (try runtime, fallback to README)
    try:
        import chromadb
        client = chromadb.PersistentClient(
            path=str(IO3 / "data/chroma"),
            settings=chromadb.Settings(anonymized_telemetry=False))
        total = sum(c.count() for c in client.list_collections())
        state["rag"]["chunk_count"] = total
    except Exception:
        readme_count = _rx("README.md", r'(\d+)\s+chunks', default=None)
        state["rag"]["chunk_count"] = (
            int(readme_count) if readme_count else "[NO ENCONTRADO]")

    # Write
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(state, indent=2, ensure_ascii=False))
    print(f"Written: {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
