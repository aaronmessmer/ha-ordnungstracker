from custom_components.ordnungstracker.core.textnorm import (
    damerau_levenshtein,
    fold,
    normalized,
    sort_key,
    tokens,
)


def test_fold_case_and_eszett() -> None:
    assert fold("HEIßKLEBE") == fold("heissklebe") == fold("heisklebe")


def test_fold_umlauts_and_digraphs() -> None:
    assert fold("Tür") == fold("tur") == fold("Tuer")
    assert fold("Käse") == fold("kaese") == fold("kase")
    assert fold("Löffel") == fold("loeffel")


def test_fold_accents() -> None:
    assert fold("Café") == fold("cafe")


def test_tokens_and_normalized() -> None:
    assert tokens("Heißkleber-Patronen (12 Stück)") == ["heiskleber", "patronen", "12", "stuck"]
    assert normalized("  Zelt   (4 Personen) ") == "zelt 4 personen"


def test_sort_key_natural_numbers() -> None:
    names = ["Kiste 10", "Kiste 2", "kiste 1"]
    assert sorted(names, key=sort_key) == ["kiste 1", "Kiste 2", "Kiste 10"]


def test_damerau_levenshtein() -> None:
    assert damerau_levenshtein("schrauben", "schrauben", 2) == 0
    assert damerau_levenshtein("schrauben", "schruaben", 2) == 1  # Vertauschung
    assert damerau_levenshtein("hammer", "hamer", 2) == 1
    assert damerau_levenshtein("hammer", "hammr", 2) == 1
    assert damerau_levenshtein("abc", "xyz", 1) == 2  # über dem Limit: limit + 1
    assert damerau_levenshtein("kurz", "viel zu lang", 2) == 3
