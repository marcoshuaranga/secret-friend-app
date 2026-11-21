@wip
Feature: Create an event
  As an organizer
  I want to create a secret friend event with the names of my group
  So that everyone can draw their secret friend from a single link

  @RF-1
  Rule: An event needs a name, 3 to 50 unique participants and an organizer password

    @ui @smoke
    Scenario: Create an event with only the required data
      Given the organizer is on the create event page
      When the organizer creates the event "Navidad 2026" with participants "Ana, Beto, Carla" and a valid password
      Then the event is created
      And the organizer sees the event link
      And the organizer is reminded to keep the organizer password

    @ui
    Scenario: Create an event with an exchange date and a suggested budget
      Given the organizer is on the create event page
      When the organizer creates the event "Navidad 2026" with:
        | participants            | date       | budget |
        | Ana, Beto, Carla, Diego | 2026-12-24 | 20 USD |
      Then the event is created
      And anyone opening the event link sees the date "2026-12-24" and the budget "20 USD"

    @ui
    Scenario Outline: Reject invalid event data
      Given the organizer is on the create event page
      When the organizer tries to create an event with <problem>
      Then the event is not created
      And the organizer is told that <explanation>

      Examples:
        | problem                    | explanation                              |
        | no event name              | the event needs a name                   |
        | only 2 participants        | at least 3 participants are needed       |
        | 51 participants            | at most 50 participants are allowed      |
        | the names "Ana, Beto, ana" | every participant needs a different name |
        | the names "Ana, Aná, Beto" | every participant needs a different name |
        | a blank participant name   | every participant needs a name           |
        | a password of 7 characters | the password needs at least 8 characters |

    @api
    Scenario Outline: The API enforces the participant limits
      When an event with <count> participants is created through the API
      Then the request <outcome>

      Examples:
        | count | outcome                                          |
        | 3     | succeeds                                         |
        | 50    | succeeds                                         |
        | 2     | is rejected as "INVALID_INPUT" on "participants" |
        | 51    | is rejected as "INVALID_INPUT" on "participants" |

  @RF-2
  Rule: Each event has its own unguessable link

    @api
    Scenario: Two identical events get different links
      When two events named "Navidad 2026" with participants "Ana, Beto, Carla" are created
      Then each event has a different link

    @api
    Scenario: The event link token is long and random
      When an event is created
      Then the event link token carries at least 256 bits of randomness

  @RF-16
  Rule: The device that creates the event becomes its organizer

    @ui
    Scenario: The creating device can open the organizer panel without a password
      Given the organizer has created the event "Navidad 2026" with participants "Ana, Beto, Carla"
      When the organizer opens the organizer panel on the same device
      Then the organizer sees the organizer panel
      And the organizer is not asked for the organizer password
