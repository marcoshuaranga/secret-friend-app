@wip @api
Feature: Fair and fixed draw
  As a group of friends
  We want the draw to be valid, fair and final
  So that nobody gets themselves and nobody can reroll their secret friend

  @RF-11 @RF-12 @smoke
  Scenario Outline: Nobody draws themselves and everyone gives and receives exactly one gift
    Given an event with <count> participants
    When every participant claims their name from their own device and fetches their secret friend
    Then no participant drew their own name
    And every participant is the secret friend of exactly one other participant

    Examples:
      | count |
      | 3     |
      | 4     |
      | 10    |
      | 50    |

  @RF-13
  Scenario: The draw is fixed when the event is created
    Given an event with participants "Ana, Beto, Carla, Diego"
    And Ana has claimed the name "Ana" from Ana's device
    And Ana has fetched the secret friend
    When Ana fetches the secret friend again
    Then Ana gets the same secret friend
