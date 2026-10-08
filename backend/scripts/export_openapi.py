"""Escreve o documento OpenAPI da API num arquivo (usado por ``pnpm gen:api``)."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from wumpus.api.app import create_app


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python scripts/export_openapi.py <arquivo-de-saida.json>")
    output = Path(sys.argv[1])
    output.parent.mkdir(parents=True, exist_ok=True)
    document = create_app().openapi()
    output.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"OpenAPI escrito em {output}")


if __name__ == "__main__":
    main()
