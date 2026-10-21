#!/usr/bin/env python3
"""Gera os pacotes de publicação da extensão.

Uso:
    python3 build.py

Cria:
    dist/chrome/   + dist/chrome.zip     (manifest de service worker)
    dist/firefox/  + dist/firefox.zip    (background como script + ID do Gecko)
"""

import json
import shutil
import zipfile
from pathlib import Path

RAIZ = Path(__file__).parent
DIST = RAIZ / "dist"

# Arquivos/pastas que vão para ambos os navegadores.
CONTEUDO_LIVRE = [
    "background.js",
    "content.js",
    "options.html",
    "options.js",
    "assets",
]

GECKO_ID = "melhorar-mensagem@daniel"  # identificador único do Firefox (não precisa ser e-mail)
GECKO_MIN = "115.0"  # primeiro Firefox com MV3 estável


def copiar_conteudo(para: Path) -> None:
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


def gravar_json(manifest: dict, para: Path) -> None:
    para.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def zipar(pasta: Path, alvo: Path) -> None:
    with zipfile.ZipFile(alvo, "w", zipfile.ZIP_DEFLATED) as z:
        # determinismo: sempre pela ordem de arquivos
        for arquivo in sorted(pasta.rglob("*")):
            if arquivo.is_file():
                z.write(arquivo, arquivo.relative_to(pasta).as_posix())


def main() -> None:
    manifest_base = json.loads((RAIZ / "manifest.json").read_text(encoding="utf-8"))

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    # ---- Chrome -----------------------------------------------------
    pasta_chrome = DIST / "chrome"
    copiar_conteudo(pasta_chrome)
    gravar_json(manifest_base, pasta_chrome / "manifest.json")
    zipar(pasta_chrome, DIST / "chrome.zip")

    # ---- Firefox ----------------------------------------------------
    pasta_fx = DIST / "firefox"
    copiar_conteudo(pasta_fx)
    m = json.loads(json.dumps(manifest_base))  # cópia profunda
    m["background"] = {"scripts": ["background.js"]}  # Firefox: event page, não service worker
    m["browser_specific_settings"] = {
        "gecko": {"id": GECKO_ID, "strict_min_version": GECKO_MIN}
    }
    gravar_json(m, pasta_fx / "manifest.json")
    zipar(pasta_fx, DIST / "firefox.zip")

    for nome in ("chrome", "firefox"):
        pasta = DIST / nome
        zip = DIST / f"{nome}.zip"
        print(f"✔ dist/{nome}/  ({tamanho(pasta)})  → {zip.name} ({tamanho(zip)})")


def tamanho(p: Path) -> str:
    n = sum(1 for f in p.rglob("*") if f.is_file()) if p.is_dir() else 0
    if n:
        return f"{n} arquivos"
    return f"{p.stat().st_size / 1024:.1f} KB" if p.exists() else "ausente"


if __name__ == "__main__":
    main()
