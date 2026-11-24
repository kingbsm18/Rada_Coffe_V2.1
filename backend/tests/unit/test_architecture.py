"""FastAPI/Starlette must stay inside the API layer (app/api)."""

import ast
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[2] / "app"
FORBIDDEN = ("fastapi", "starlette")
FRAMEWORK_FREE = ("core", "modules", "workers")


def imported_roots(path: Path) -> set[str]:
    roots: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.Import):
            roots.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            roots.add(node.module.split(".")[0])
    return roots


def test_framework_imports_are_confined_to_the_api_layer() -> None:
    offenders = [
        str(path.relative_to(APP_ROOT))
        for package in FRAMEWORK_FREE
        for path in (APP_ROOT / package).rglob("*.py")
        if imported_roots(path) & set(FORBIDDEN)
    ]
    assert offenders == []


def test_modules_do_not_import_the_api_layer() -> None:
    offenders = []
    for path in (APP_ROOT / "modules").rglob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.ImportFrom) and (node.module or "").startswith("app.api"):
                offenders.append(str(path.relative_to(APP_ROOT)))
    assert offenders == []
