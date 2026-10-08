"""Sintaxe e semântica da lógica proposicional.

As sentenças são árvores imutáveis. ``str(sentence)`` produz a notação usada em aula
(¬, ∧, ∨, ⇒, ⇔) e ``evaluate`` define em quais modelos a sentença é verdadeira.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Symbol:
    name: str

    def __str__(self) -> str:
        return self.name


@dataclass(frozen=True, slots=True)
class Not:
    operand: Sentence

    def __str__(self) -> str:
        return f"¬{_wrap(self.operand)}"


@dataclass(frozen=True, slots=True)
class And:
    operands: tuple[Sentence, ...]

    def __post_init__(self) -> None:
        if len(self.operands) < 2:
            raise ValueError("And requires at least two operands; use conjunction() instead")

    def __str__(self) -> str:
        return " ∧ ".join(_wrap(operand) for operand in self.operands)


@dataclass(frozen=True, slots=True)
class Or:
    operands: tuple[Sentence, ...]

    def __post_init__(self) -> None:
        if len(self.operands) < 2:
            raise ValueError("Or requires at least two operands; use disjunction() instead")

    def __str__(self) -> str:
        return " ∨ ".join(_wrap(operand) for operand in self.operands)


@dataclass(frozen=True, slots=True)
class Implies:
    antecedent: Sentence
    consequent: Sentence

    def __str__(self) -> str:
        return f"{_wrap(self.antecedent)} ⇒ {_wrap(self.consequent)}"


@dataclass(frozen=True, slots=True)
class Iff:
    left: Sentence
    right: Sentence

    def __str__(self) -> str:
        return f"{_wrap(self.left)} ⇔ {_wrap(self.right)}"


type Sentence = Symbol | Not | And | Or | Implies | Iff


def conjunction(*operands: Sentence) -> Sentence:
    """Builds ``a ∧ b ∧ ...``, collapsing to the operand itself when there is only one."""
    if not operands:
        raise ValueError("conjunction() requires at least one operand")
    return operands[0] if len(operands) == 1 else And(operands)


def disjunction(*operands: Sentence) -> Sentence:
    """Builds ``a ∨ b ∨ ...``, collapsing to the operand itself when there is only one."""
    if not operands:
        raise ValueError("disjunction() requires at least one operand")
    return operands[0] if len(operands) == 1 else Or(operands)


def evaluate(sentence: Sentence, model: Mapping[str, bool]) -> bool:
    """Truth value of ``sentence`` in ``model``. Every symbol must be assigned."""
    match sentence:
        case Symbol(name):
            if name not in model:
                raise KeyError(f"Symbol {name!r} is not assigned in the model")
            return model[name]
        case Not(operand):
            return not evaluate(operand, model)
        case And(operands):
            return all(evaluate(operand, model) for operand in operands)
        case Or(operands):
            return any(evaluate(operand, model) for operand in operands)
        case Implies(antecedent, consequent):
            return not evaluate(antecedent, model) or evaluate(consequent, model)
        case Iff(left, right):
            return evaluate(left, model) == evaluate(right, model)


def symbols_of(sentence: Sentence) -> frozenset[str]:
    """Names of every proposition symbol that appears in ``sentence``."""
    match sentence:
        case Symbol(name):
            return frozenset({name})
        case Not(operand):
            return symbols_of(operand)
        case And(operands) | Or(operands):
            return frozenset().union(*(symbols_of(operand) for operand in operands))
        case Implies(left, right) | Iff(left, right):
            return symbols_of(left) | symbols_of(right)


def _wrap(sentence: Sentence) -> str:
    text = str(sentence)
    return text if isinstance(sentence, Symbol | Not) else f"({text})"
