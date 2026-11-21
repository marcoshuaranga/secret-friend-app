Feature: Handle unusable event links
  As a participant
  I want a clear message when the link cannot be used
  So that I know why and who to ask for help

  @RF-2 @ui
  Scenario Outline: An invalid link shows an error page
    When a visitor opens the event link with token "<token>"
    Then the visitor sees the "invalid_link" error page

    Examples:
      | token                                  |
      | does-not-exist-0000000000000000000000  |
      | short                                  |

  @RF-2 @ui
  Scenario: A link without a token shows an error page
    When a visitor opens the event page without a token
    Then the visitor sees the "invalid_link" error page

  @RF-2 @api
  Scenario: The API does not find an unknown event
    When anyone requests the public event data with an unknown token
    Then the request fails as "event_not_found"

  @assumption @ui
  Scenario Outline: An event expires 90 days after it is created
    Given an event created <age> days ago
    When a visitor opens the event link
    Then the visitor sees <outcome>

    Examples:
      | age | outcome                         |
      | 89  | the participant list            |
      | 91  | the "expired_link" error page   |

  @RF-5 @ui
  Scenario: A new visitor is told when every name is already taken
    Given an event with participants "Ana, Beto, Carla"
    And every participant has claimed their name
    When a visitor opens the event link on a new device
    Then the visitor sees the "all_names_taken" error page
