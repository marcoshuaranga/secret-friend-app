@privacy
Feature: Keep every assignment private
  As a participant
  I want nobody else to be able to see who I give a gift to
  So that the surprise is kept, even from people who inspect the app

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego"

  @api
  Scenario: Public event data contains no assignments
    When anyone requests the public event data
    Then the response includes the event name, participants and which names are taken
    But the response includes no assignment

  @api
  Scenario Outline: The result is denied without a valid device token
    When someone requests the result <credentials>
    Then the request is denied as "unauthorized"

    Examples:
      | credentials                            |
      | without a device token                 |
      | with a tampered device token           |
      | with a device token from another event |

  @api
  Scenario: A device token only reveals its own assignment
    Given Ana has claimed the name "Ana" through the API
    And Beto has claimed the name "Beto" through the API
    When Ana requests the result with the device token of Ana
    Then the response contains only the secret friend of "Ana"

  @api
  Scenario: The admin key does not reveal any assignment
    When the organizer requests the result with the admin key
    Then the request is denied as "unauthorized"

  @ui
  Scenario: Nothing on the device exposes other assignments
    Given Ana has claimed the name "Ana"
    When Ana reveals the secret friend
    Then no network response received by the device of Ana contains another participant's assignment
    And no data stored on the device of Ana contains another participant's assignment
