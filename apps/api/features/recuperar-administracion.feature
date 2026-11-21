# language: es
Característica: Recuperar la administración
  Cubre RF-21: la huella solo sugiere eventos; entrar exige la contraseña,
  con un límite de 5 intentos fallidos por hora.

  Antecedentes:
    Dado que "Ana" creó desde "el iPhone de Ana" el evento "Navidad" con la contraseña "secreto123"

  Escenario: La huella sugiere el evento pero no da acceso
    Cuando "Ana en Safari" pide recuperación con la huella de "el iPhone de Ana"
    Entonces se le sugiere el evento "Navidad"
    Y "Ana en Safari" no puede abrir el panel de "Navidad"

  Escenario: Una huella distinta no sugiere nada
    Cuando "Extraño" pide recuperación con la huella de "otro teléfono"
    Entonces no se le sugiere ningún evento

  Escenario: Con la contraseña correcta el dispositivo queda como administrador
    Cuando "Ana en Safari" entra a "Navidad" con la contraseña "secreto123"
    Entonces la respuesta es 200
    Y "Ana" es administradora de "Navidad"
    Y "Ana en Safari" es administradora de "Navidad"

  Escenario: Una contraseña incorrecta no da acceso
    Cuando "Extraño" entra a "Navidad" con la contraseña "adivinanza"
    Entonces la respuesta es 401 con el error "UNAUTHORIZED"

  Escenario: Tras 5 intentos fallidos se bloquea incluso la contraseña correcta
    Dado que "Extraño" falló 5 veces la contraseña de "Navidad"
    Cuando "Ana en Safari" entra a "Navidad" con la contraseña "secreto123"
    Entonces la respuesta es 429 con el error "TOO_MANY_ATTEMPTS"
    Pero una hora después "Ana en Safari" entra a "Navidad" con la contraseña "secreto123"
    Y la respuesta es 200
