"""Verificação de modelos por enumeração (TT-Entails), como na tabela-verdade dos slides.

O custo é O(2ⁿ) para n símbolos. Por isso ``enumerate_models`` permite fixar os símbolos
já conhecidos e enumerar só os desconhecidos, como os poços candidatos da fronteira.
"""

from collections.abc import Iterable, Iterator, Mapping, Sequence
from itertools import product

from wumpus.logic.cnf import Clause, clause_symbols, is_clause_satisfied
from wumpus.logic.sentences import Sentence, evaluate, symbols_of

type Model = dict[str, bool]


def tt_entails(knowledge_base: Sentence, query: Sentence) -> bool:
    """``KB ⊨ α``: α holds in every row of the truth table where the KB holds."""
    symbols = sorted(symbols_of(knowledge_base) | symbols_of(query))
    return all(
        evaluate(query, model)
        for model in _all_assignments(symbols, {})
        if evaluate(knowledge_base, model)
    )


def count_models(knowledge_base: Sentence) -> int:
    symbols = sorted(symbols_of(knowledge_base))
    return sum(1 for model in _all_assignments(symbols, {}) if evaluate(knowledge_base, model))


def enumerate_models(
    clauses: Iterable[Clause],
    symbols: Sequence[str],
    fixed: Mapping[str, bool],
) -> list[Model]:
    """Assignments to ``symbols`` that, together with ``fixed``, satisfy the clauses.

    Only clauses whose symbols are all in ``symbols`` or ``fixed`` take part, so the
    result is exact when the remaining clauses never mention the enumerated symbols.
    """
    known = set(symbols) | set(fixed)
    relevant = [target for target in clauses if clause_symbols([target]) <= known]
    return [
        {name: model[name] for name in symbols}
        for model in _all_assignments(symbols, fixed)
        if all(is_clause_satisfied(target, model) for target in relevant)
    ]


def _all_assignments(symbols: Sequence[str], fixed: Mapping[str, bool]) -> Iterator[Model]:
    for values in product((False, True), repeat=len(symbols)):
        yield {**fixed, **dict(zip(symbols, values, strict=True))}
