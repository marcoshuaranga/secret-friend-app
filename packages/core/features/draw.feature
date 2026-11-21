@domain
Feature: Draw the secret friends
  As a group of friends
  We want a draw where nobody gets themselves and every valid outcome is equally likely
  So that the secret friend exchange is valid and fair

  @RF-11 @RF-12
  Scenario Outline: Nobody draws themselves
    Given a group of <count> participants
    When the draw is made
    Then the draw is valid
    And no participant draws themselves
    And every participant gives to one person and receives from another

    Examples:
      | count |
      | 3     |
      | 4     |
      | 10    |
      | 50    |

  @RF-13
  Scenario: The same seed always produces the same draw
    Given a group of 8 participants
    When the draw is made twice with the same seed
    Then both draws are identical

  @RF-12
  Scenario: Every valid outcome is equally likely
    Given a group of 4 participants
    When 9000 draws are made with different seeds
    Then all 9 possible outcomes appear
    And each outcome appears about 1000 times

  @RF-1
  Scenario Outline: An invalid group size is rejected
    Given a group of <count> participants
    When the draw is made
    Then the draw fails with the error "<error>"

    Examples:
      | count | error                 |
      | 2     | too_few_participants  |
      | 51    | too_many_participants |

  @RF-1
  Scenario: Repeated names are rejected
    Given the participants "Ana, Beto, Ana"
    When the draw is made
    Then the draw fails with the error "duplicate_participants"
