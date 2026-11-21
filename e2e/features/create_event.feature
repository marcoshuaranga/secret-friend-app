@RF-1 @RF-2
Feature: Create an event
  As an organizer
  I want to create a secret friend event with the names of my group
  So that everyone can draw their secret friend from a single link

  Rule: An event needs a name and between 3 and 50 unique participants

    @ui @smoke
    Scenario: Create an event with only the required data
      Given the organizer is on the create event page
      When the organizer creates the event "Navidad 2026" with participants "Ana, Beto, Carla"
      Then the event is created
      And the organizer sees the event link
      And the organizer sees the admin key

    @ui
    Scenario: Create an event with an exchange date and a suggested budget
      Given the organizer is on the create event page
      When the organizer creates the event "Navidad 2026" with:
        | participants            | date       | budget |
        | Ana, Beto, Carla, Diego | 2026-12-24 | 20 USD |
      Then the event is created
      And anyone opening the event link sees the date "2026-12-24" and the budget "20 USD"

    @api
    Scenario Outline: Accept the participant count limits
      When the organizer creates an event with <count> participants
      Then the event is created

      Examples:
        | count |
        | 3     |
        | 50    |

    @api
    Scenario Outline: Reject an event with too few or too many participants
      When the organizer creates an event with <count> participants
      Then the event is not created
      And the organizer is told "<error>"

      Examples:
        | count | error                 |
        | 2     | too_few_participants  |
        | 51    | too_many_participants |

    @ui
    Scenario Outline: Reject invalid event data
      Given the organizer is on the create event page
      When the organizer creates the event "<event>" with participants "<participants>"
      Then the event is not created
      And the organizer is told "<error>"

      Examples: Missing event name
        | event | participants     | error              |
        |       | Ana, Beto, Carla | missing_event_name |

      Examples: Repeated names, ignoring surrounding spaces
        | event        | participants      | error                  |
        | Navidad 2026 | Ana, Beto, Ana    | duplicate_participants |
        | Navidad 2026 | Ana, Beto,   Ana  | duplicate_participants |

      Examples: Blank names
        | event        | participants      | error                  |
        | Navidad 2026 | Ana, , Carla      | blank_participant_name |

  Rule: Each event has its own unguessable link

    @api
    Scenario: Two identical events get different links
      When the organizer creates two events named "Navidad 2026" with participants "Ana, Beto, Carla"
      Then each event has a different link

    @api
    Scenario: The event link token is long and random
      When the organizer creates an event with 3 participants
      Then the event link token carries at least 128 bits of randomness
