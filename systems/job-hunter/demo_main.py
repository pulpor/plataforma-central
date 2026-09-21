"""DEMO stand-in for the real Job Hunter system.

This is NOT connected to any real job board. It exists so the Python Hub UI
has a fully working example end-to-end (real subprocess execution, real
progress streaming, real JSON output) while you don't have a GitHub
repository plugged in yet.

To connect your real system:
  1. Set "repository" in config.json to your GitHub repo URL (for reference).
  2. Replace the "command" in config.json to run your real script (or clone
     your repo into this folder and point the command at it).
  3. Make your script follow the same protocol used below: print
     "PROGRESS {json}" lines and write the final JSON array to the path in
     the PH_OUTPUT_FILE environment variable.
"""

import json
import os
import random
import sys
import time


def emit_progress(progress: int, message: str) -> None:
    print(f"PROGRESS {json.dumps({'progress': progress, 'message': message})}")
    sys.stdout.flush()


COMPANIES = ["TechNova", "DataCraft", "CloudWorks", "NextGen Software", "Orion Labs", "Vertex Systems"]
ROLES = ["Desenvolvedor Python", "Engenheiro de Dados", "Analista de BI", "Backend Developer", "Automation Engineer"]
CITIES = ["São Paulo, SP", "Remoto", "Belo Horizonte, MG", "Curitiba, PR", "Rio de Janeiro, RJ"]
MODELS = ["Remoto", "Híbrido", "Presencial"]


def main() -> None:
    emit_progress(5, "Iniciando sistema...")
    time.sleep(1)
    emit_progress(20, "Conectando às fontes de vagas...")
    time.sleep(1.5)
    emit_progress(45, "Processando resultados...")
    time.sleep(1)

    total = random.randint(8, 16)
    results = []
    for i in range(total):
        results.append(
            {
                "empresa": random.choice(COMPANIES),
                "cargo": random.choice(ROLES),
                "local": random.choice(CITIES),
                "salario": random.randint(4500, 15000),
                "modelo": random.choice(MODELS),
                "link": f"https://example.com/vagas/{i + 1}",
            }
        )
        progress = 45 + int(40 * (i + 1) / total)
        emit_progress(progress, f"Encontrados {i + 1} registros...")
        time.sleep(0.15)

    emit_progress(95, "Finalizando...")

    output_path = os.environ.get("PH_OUTPUT_FILE")
    if output_path:
        with open(output_path, "w", encoding="utf-8") as handle:
            json.dump(results, handle, ensure_ascii=False)

    emit_progress(100, f"Encontrados {len(results)} registros.")


if __name__ == "__main__":
    main()
