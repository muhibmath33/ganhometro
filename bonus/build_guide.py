"""Renders bonus/guide/guia-carne-leao-2026.html to public/Guia-Carne-leao-2026-Ganhometro.pdf.

    python bonus/build_guide.py          (uses Chrome or Edge; set CHROME=/path/to/browser to override)

Keep the guide's numbers in sync with build_carne_leao.py (its examples come from that model).
"""

import os
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
SOURCE = HERE / "guide" / "guia-carne-leao-2026.html"
OUT = HERE.parent / "public" / "Guia-Carne-leao-2026-Ganhometro.pdf"

CANDIDATES = [
    os.environ.get("CHROME", ""),
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    shutil.which("google-chrome") or "",
    shutil.which("chromium") or "",
]


def main():
    browser = next((c for c in CANDIDATES if c and Path(c).exists()), None)
    if not browser:
        raise SystemExit("Chrome/Edge not found; set CHROME=/path/to/browser")
    subprocess.run(
        [browser, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={OUT}", SOURCE.resolve().as_uri()],
        check=True, capture_output=True, timeout=120,
    )
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
