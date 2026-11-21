@wip @privacy
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
  Scenario Outline: The result is only given to a device that claimed a name in the event
    When the result is requested from <device>
    Then the request is rejected as "<error>"

    Examples:
      | device                                      | error        |
      | a device without identity                   | UNAUTHORIZED |
      | a device with a forged identity             | UNAUTHORIZED |
      | a device that only claimed in another event | NOT_CLAIMED  |

  @api
  Scenario: A device only gets its own assignment
    Given Ana has claimed the name "Ana" from Ana's device
    And Beto has claimed the name "Beto" from Beto's device
    When Ana requests the result from Ana's device
    Then the response contains only the secret friend of "Ana"

  @api
  Scenario: Being the organizer does not reveal other assignments
    Given the organizer's device has claimed the name "Carla"
    When the organizer requests the result from the organizer's device
    Then the response contains only the secret friend of "Carla"

  @ui
  Scenario: Nothing on the device exposes other assignments
    Given Ana has claimed the name "Ana"
    When Ana reveals the secret friend
    Then no network response received by Ana's device contains another participant's assignment
    And no data stored on Ana's device contains another participant's assignment
