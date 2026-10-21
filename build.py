#!/usr/bin/env python3
"""Gera os pacotes de publicação da extensão.

Uso:
    python3 build.py

Cria:
    dist/chrome/   + dist/chrome.zip     (usa manifest.json)
    dist/firefox/  + dist/firefox.zip    (usa manifest.firefox.json)

Importante: nenhum código é gerado por este script — ele apenas COPIA os
arquivos escritos por humanos e empacota. Isso é requisito do processo de
revisão do AMO, que pergunta sobre ferramentas de geração de código.
"""

import json
import shutil
import zipfile
from pathlib import Path

RAIZ = Path(__file__).parent
DIST = RAIZ / "dist"

# Arquivos/pastas que vão para ambos os navegadores (todos manuais, nenhum gerado).
CONTEUDO_LIVRE = [
    "background.js",
    "content.js",
    "options.html",
    "options.js",
    "onboarding.html",
    "onboarding.js",
    "assets",
]


def copiar_conteudo(para: Path, manifest_destino: Path, manifest_source: str) -> None:
    para.parent.mkdir(parents=True, exist_ok=True)
    for nome in CONTEUDO_LIVRE:
        origem = RAIZ / nome
        destino = para / nome
        if origem.is_dir():
            shutil.copytree(origem, destino, ignore=shutil.ignore_patterns("__pycache__"))
        elif origem.exists():
            destino.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(origem, destino)
        else:
            raise SystemExit(f"Faltando arquivo esperado no projeto: {nome}")
    shutil.copy2(RAIZ / manifest_source, manifest_destino)


def zipar(pasta: Path, alvo: Path) -> None:
    with zipfile.ZipFile(alvo, "w", zipfile.ZIP_DEFLATED) as z:
        for arquivo in sorted(pasta.rglob("*")):
            if arquivo.is_file():
                z.write(arquivo, arquivo.relative_to(pasta).as_posix())


def verificar_manifests() -> None:
    chrome = json.loads((RAIZ / "manifest.json").read_text(encoding="utf-8"))
    firefox = json.loads((RAIZ / "manifest.firefox.json").read_text(encoding="utf-8"))
    if chrome["version"] != firefox["version"]:
        raise SystemExit(
            f"Versões divergentes: manifest.json='{chrome['version']}' "
            f"manifest.firefox.json='{firefox['version']}'. Atualize as duas."
        )
    print(f"✔ manifests sincronizados na versão {chrome['version']}")


def main() -> None:
    verificar_manifests()
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    pasta_chrome = DIST / "chrome"
    copiar_conteudo(pasta_chrome, pasta_chrome / "manifest.json", "manifest.json")
    zipar(pasta_chrome, DIST / "chrome.zip")

    pasta_fx = DIST / "firefox"
    copiar_conteudo(pasta_fx, pasta_fx / "manifest.json", "manifest.firefox.json")
    zipar(pasta_fx, DIST / "firefox.zip")

    for nome in ("chrome", "firefox"):
        pasta = DIST / nome
        zip = DIST / f"{nome}.zip"
        n = sum(1 for f in pasta.rglob("*") if f.is_file())
        print(f"✔ dist/{nome}/  ({n} arquivos)  → {zip.name}")


if __name__ == "__main__":
    main()
