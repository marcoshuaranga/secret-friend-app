@assumption
Feature: Release a claimed name
  As an organizer
  I want to release a name that was claimed by mistake or from a lost device
  So that the right person can claim it and see their secret friend

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego"
    And Beto has claimed the name "Ana" by mistake

  @ui
  Scenario: The organizer releases a claimed name with the admin key
    When the organizer releases "Ana" from the admin page
    Then "Ana" is available again
    And Ana can claim the name "Ana"

  @api
  Scenario: The previous device loses access after the release
    When the organizer releases "Ana" with the admin key
    Then the device token of Beto no longer gets a result

  @RF-13 @api
  Scenario: The secret friend does not change after the name is released
    Given the secret friend assigned to "Ana" is known
    When the organizer releases "Ana" with the admin key
    And Ana claims the name "Ana" through the API
    Then Ana gets the same secret friend as before

  @api
  Scenario Outline: A name cannot be released without the right admin key
    When someone releases "Ana" <credentials>
    Then the request is denied as "unauthorized"
    And "Ana" is still taken

    Examples:
      | credentials                         |
      | without an admin key                |
      | with a wrong admin key              |
      | with the admin key of another event |
