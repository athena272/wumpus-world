"""Base de conhecimento R1..R5 dos slides ("Sentenças do Mundo de Wumpus")."""

from wumpus.logic.sentences import Iff, Not, Or, Sentence, Symbol, conjunction

B11 = Symbol("B[1,1]")
B21 = Symbol("B[2,1]")
P11 = Symbol("P[1,1]")
P12 = Symbol("P[1,2]")
P21 = Symbol("P[2,1]")
P22 = Symbol("P[2,2]")
P31 = Symbol("P[3,1]")

R1 = Not(P11)
R2 = Not(B11)
R3 = B21
R4 = Iff(B11, Or((P12, P21)))
R5 = Iff(B21, Or((P11, P22, P31)))

SLIDES_KB: Sentence = conjunction(R1, R2, R3, R4, R5)
