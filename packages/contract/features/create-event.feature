# language: es
Característica: Validación de la creación de un evento
  Cubre RF-1 (nombre y 3–50 participantes con nombres únicos) y RF-21 (contraseña del organizador).

  Escenario: Se acepta un evento válido
    Dado un evento llamado "Navidad oficina" con los participantes "Ana, Beto, Carla"
    Cuando se valida la creación
    Entonces la validación es correcta

  Escenario: Se recortan los espacios sobrantes
    Dado un evento llamado "  Navidad  " con los participantes " Ana , Beto,Carla "
    Cuando se valida la creación
    Entonces la validación es correcta
    Y el evento se llama "Navidad"
    Y los participantes son "Ana, Beto, Carla"

  Escenario: Se aceptan fecha y presupuesto opcionales
    Dado un evento llamado "Navidad" con los participantes "Ana, Beto, Carla"
    Y la fecha "2026-12-24" y el presupuesto "20 USD"
    Cuando se valida la creación
    Entonces la validación es correcta

  Esquema del escenario: Se rechaza un número inválido de participantes
    Dado un evento llamado "Navidad" con <cantidad> participantes
    Cuando se valida la creación
    Entonces la validación falla en "participants"

    Ejemplos:
      | cantidad |
      | 0        |
      | 2        |
      | 51       |

  Escenario: Se rechazan nombres repetidos sin distinguir mayúsculas
    Dado un evento llamado "Navidad" con los participantes "Ana, Beto, ana"
    Cuando se valida la creación
    Entonces la validación falla en "participants"

  Escenario: Se rechazan nombres repetidos sin distinguir tildes
    Dado un evento llamado "Navidad" con los participantes "Ana, Beto, Aná"
    Cuando se valida la creación
    Entonces la validación falla en "participants"

  Escenario: Se rechaza una contraseña de organizador corta
    Dado un evento llamado "Navidad" con los participantes "Ana, Beto, Carla"
    Y la contraseña "1234567"
    Cuando se valida la creación
    Entonces la validación falla en "password"

  Escenario: Se rechaza un nombre de participante vacío
    Dado un evento llamado "Navidad" con los participantes "Ana, Beto,   "
    Cuando se valida la creación
    Entonces la validación falla en "participants.2"

  Escenario: Se rechaza un evento sin nombre
    Dado un evento llamado "   " con los participantes "Ana, Beto, Carla"
    Cuando se valida la creación
    Entonces la validación falla en "name"

  Escenario: Se rechaza una fecha con formato incorrecto
    Dado un evento llamado "Navidad" con los participantes "Ana, Beto, Carla"
    Y la fecha "24/12/2026" y el presupuesto "20 USD"
    Cuando se valida la creación
    Entonces la validación falla en "date"

  Escenario: Se rechaza una entrada que no es un objeto
    Cuando se valida la creación de una entrada nula
    Entonces la validación falla
