import json

import jsonschema

from scripts.export_contracts import CONTRACT_PATH, render


def test_committed_contract_matches_the_backend_model() -> None:
    assert CONTRACT_PATH.read_text() == render(), (
        "Contract drift: run `python -m scripts.export_contracts` from backend/"
    )


def test_contract_is_a_valid_json_schema() -> None:
    jsonschema.Draft202012Validator.check_schema(json.loads(CONTRACT_PATH.read_text()))
