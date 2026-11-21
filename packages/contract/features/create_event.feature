@domain @RF-1
Feature: Validate the input to create an event
  As the API
  I want to reject invalid event data at the edge
  So that only an event with a name and 3 to 50 unique participants reaches the draw

  Scenario: A valid event is accepted
    Given an event named "Navidad oficina" with participants "Ana, Beto, Carla"
    When the input is validated
    Then the input is valid

  Scenario: Surrounding spaces are trimmed
    Given an event named "  Navidad  " with participants " Ana , Beto,Carla "
    When the input is validated
    Then the input is valid
    And the event is named "Navidad"
    And the participants are "Ana, Beto, Carla"

  Scenario: Date and budget are optional
    Given an event named "Navidad" with participants "Ana, Beto, Carla"
    And the date "2026-12-24" and the budget "20 USD"
    When the input is validated
    Then the input is valid

  Scenario Outline: An invalid number of participants is rejected
    Given an event named "Navidad" with <count> participants
    When the input is validated
    Then the input is invalid at "participants"

    Examples:
      | count |
      | 0     |
      | 2     |
      | 51    |

  Scenario: Repeated names are rejected regardless of letter case
    Given an event named "Navidad" with participants "Ana, Beto, ana"
    When the input is validated
    Then the input is invalid at "participants"

  Scenario: An empty participant name is rejected
    Given an event named "Navidad" with participants "Ana, Beto,   "
    When the input is validated
    Then the input is invalid at "participants.2"

  Scenario: An event without a name is rejected
    Given an event named "   " with participants "Ana, Beto, Carla"
    When the input is validated
    Then the input is invalid at "name"

  Scenario: A date in the wrong format is rejected
    Given an event named "Navidad" with participants "Ana, Beto, Carla"
    And the date "24/12/2026" and the budget "20 USD"
    When the input is validated
    Then the input is invalid at "date"

  Scenario: An input that is not an object is rejected
    When a null input is validated
    Then the input is invalid
