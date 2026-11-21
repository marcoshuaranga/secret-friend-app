# language: es
Característica: Sorteo del amigo secreto
  Cubre RF-11 (nadie se toca a sí mismo), RF-12 (reparto justo) y RF-13 (el sorteo se genera una vez).

  Esquema del escenario: Nadie se toca a sí mismo
    Dado un grupo de <cantidad> participantes
    Cuando se realiza el sorteo
    Entonces el sorteo es válido
    Y ningún participante se toca a sí mismo
    Y cada participante regala a una persona y recibe de otra

    Ejemplos:
      | cantidad |
      | 3        |
      | 4        |
      | 10       |
      | 50       |

  Escenario: El sorteo se puede repetir con la misma semilla
    Dado un grupo de 8 participantes
    Cuando se realiza el sorteo dos veces con la misma semilla
    Entonces ambos sorteos son idénticos

  Escenario: Todos los repartos válidos son igual de probables
    Dado un grupo de 4 participantes
    Cuando se realizan 9000 sorteos con semillas distintas
    Entonces aparecen los 9 repartos posibles
    Y cada reparto aparece cerca de 1000 veces

  Esquema del escenario: Se rechaza un grupo inválido
    Dado un grupo de <cantidad> participantes
    Cuando se realiza el sorteo
    Entonces el sorteo falla con el error "<error>"

    Ejemplos:
      | cantidad | error                  |
      | 2        | too_few_participants   |
      | 51       | too_many_participants  |

  Escenario: Se rechazan nombres repetidos
    Dado los participantes "Ana, Beto, Ana"
    Cuando se realiza el sorteo
    Entonces el sorteo falla con el error "duplicate_participants"
