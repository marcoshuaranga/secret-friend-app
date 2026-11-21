# language: es
Característica: Tira de nombres de la ruleta
  Cubre RF-8 (nunca el propio nombre), RF-9 (la ruleta no decide) y RF-15 (casi aciertos).

  Esquema del escenario: La ruleta termina en el resultado real
    Dado que Ana ve la ruleta con los demás participantes "<otros>" y su resultado es "<resultado>"
    Cuando se genera la tira con la semilla <semilla>
    Entonces la tira termina en "<resultado>"
    Y la tira no contiene "Ana"
    Y la tira nunca repite un nombre seguido
    Y "<resultado>" aparece poco antes del final

    Ejemplos:
      | otros                  | resultado | semilla |
      | Luis, Marta            | Marta     | 1       |
      | Luis, Marta, Pedro, Sol | Pedro    | 7       |
      | Luis, Marta, Pedro, Sol | Luis     | 99      |
