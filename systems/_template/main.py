"""Template/adapter for a new Python Hub system.

Copy this "_template" folder to systems/<seu-sistema-id>/, rename this file if
you want, and update config.json's "command" to match. This file shows the
minimal protocol every system must speak with the backend:

1. Print progress updates to stdout as a single line:
       PROGRESS {"progress": <0-100>, "message": "<texto amigável>"}
   The backend parses these lines in real time and forwards them to the UI
   through Server-Sent Events.

2. Write the final list of result records (a JSON array of flat objects) to
   the file path given in the PH_OUTPUT_FILE environment variable. Keys must
   match the "key" values declared in config.json's output.columns.

If you already have a real script/repository, you do not need to rewrite it:
create a thin adapter (like this file) that imports/calls your real code and
translates its output into this protocol. See README.md > "Como conectar um
sistema real" for the two supported integration strategies.
"""

import json
import os
import sys
import time


def emit_progress(progress: int, message: str) -> None:
    print(f"PROGRESS {json.dumps({'progress': progress, 'message': message})}")
    sys.stdout.flush()


def main() -> None:
    emit_progress(5, "Iniciando sistema...")
    time.sleep(0.5)

    emit_progress(40, "Processando resultados...")
    time.sleep(0.5)

    results = [
        {"campo_1": "Exemplo A", "campo_2": 100.0, "link": "https://example.com/a"},
        {"campo_1": "Exemplo B", "campo_2": 250.5, "link": "https://example.com/b"},
    ]

    output_path = os.environ.get("PH_OUTPUT_FILE")
    if output_path:
        with open(output_path, "w", encoding="utf-8") as handle:
            json.dump(results, handle, ensure_ascii=False)

    emit_progress(100, f"Encontrados {len(results)} registros.")


if __name__ == "__main__":
    main()
