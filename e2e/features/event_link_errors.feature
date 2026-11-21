@wip
Feature: Handle unusable event links
  As a participant
  I want a clear message when the link cannot be used
  So that I know why and who to ask for help

  @RF-2 @ui
  Scenario Outline: An invalid link shows an error page
    When a visitor opens the event link with token "<token>"
    Then the visitor is told the link is invalid or expired

    Examples:
      | token                                 |
      | does-not-exist-0000000000000000000000 |
      | short                                 |

  @RF-2 @ui
  Scenario: A link without a token shows an error page
    When a visitor opens the event page without a token
    Then the visitor is told the link is invalid or expired

  @RF-2 @api
  Scenario: The API does not find an unknown event
    When anyone requests the public event data with an unknown token
    Then the request is rejected as "NOT_FOUND"

  @retention
  Rule: An event and its data are deleted 90 days after it is created

    @ui
    Scenario: An event can still be opened before it expires
      Given an event created 89 days ago
      When a visitor opens the event link
      Then the visitor sees the participant list

    @ui
    Scenario: An expired event shows an error page
      Given an event created 91 days ago
      When a visitor opens the event link
      Then the visitor is told the link is invalid or expired

    @api
    Scenario: The API treats an expired event as missing
      Given an event created 91 days ago
      When anyone requests the public event data
      Then the request is rejected as "NOT_FOUND"
