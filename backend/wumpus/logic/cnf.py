"""Forma normal conjuntiva (CNF): literais, cláusulas e conversão de sentenças."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

from wumpus.logic.sentences import And, Iff, Implies, Not, Or, Sentence, Symbol


@dataclass(frozen=True, slots=True, order=True)
class Literal:
    symbol: str
    positive: bool = True

    def negate(self) -> Literal:
        return Literal(self.symbol, not self.positive)

    def __str__(self) -> str:
        return self.symbol if self.positive else f"¬{self.symbol}"


type Clause = frozenset[Literal]
"""Disjunção de literais. A cláusula vazia é a contradição."""


def clause(*literals: Literal) -> Clause:
    return frozenset(literals)


def is_tautology(candidate: Clause) -> bool:
    return any(literal.negate() in candidate for literal in candidate)


def clause_to_str(target: Clause) -> str:
    if not target:
        return "□"
    return " ∨ ".join(str(literal) for literal in sorted(target))


def is_clause_satisfied(target: Clause, model: Mapping[str, bool]) -> bool:
    """True when some literal of the clause holds in ``model`` (symbols must be assigned)."""
    return any(model[literal.symbol] == literal.positive for literal in target)


def clause_symbols(clauses: Iterable[Clause]) -> frozenset[str]:
    return frozenset(literal.symbol for target in clauses for literal in target)


def to_cnf(sentence: Sentence) -> frozenset[Clause]:
    """Converts ``sentence`` into an equivalent set of clauses, without tautologies."""
    return _distribute(_to_nnf(sentence, negated=False))


def _to_nnf(sentence: Sentence, *, negated: bool) -> Sentence:
    """Negation normal form: only symbols can be negated, ⇒ and ⇔ are eliminated."""
    match sentence:
        case Symbol():
            return Not(sentence) if negated else sentence
        case Not(operand):
            return _to_nnf(operand, negated=not negated)
        case And(operands):
            parts = tuple(_to_nnf(operand, negated=negated) for operand in operands)
            return Or(parts) if negated else And(parts)
        case Or(operands):
            parts = tuple(_to_nnf(operand, negated=negated) for operand in operands)
            return And(parts) if negated else Or(parts)
        case Implies(antecedent, consequent):
            return _to_nnf(Or((Not(antecedent), consequent)), negated=negated)
        case Iff(left, right):
            both_ways = And((Implies(left, right), Implies(right, left)))
            return _to_nnf(both_ways, negated=negated)


def _distribute(nnf: Sentence) -> frozenset[Clause]:
    match nnf:
        case Symbol(name):
            return frozenset({clause(Literal(name, True))})
        case Not(Symbol(name)):
            return frozenset({clause(Literal(name, False))})
        case And(operands):
            return frozenset().union(*(_distribute(operand) for operand in operands))
        case Or(operands):
            combined: frozenset[Clause] = frozenset({clause()})
            for operand in operands:
                combined = frozenset(
                    left | right for left in combined for right in _distribute(operand)
                )
            return frozenset(candidate for candidate in combined if not is_tautology(candidate))
        case _:
            raise ValueError(f"Sentence is not in negation normal form: {nnf}")
