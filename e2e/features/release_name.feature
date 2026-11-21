@wip @RF-18
Feature: Release a claimed name
  As an organizer
  I want to release a name that was picked by mistake or from a lost device
  So that the right person can pick it and see their secret friend

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego" created on the organizer's device
    And Beto has claimed the name "Ana" by mistake from Beto's device

  @ui
  Scenario: Releasing a name asks for confirmation
    When the organizer releases "Ana" from the organizer panel
    Then the organizer is asked to confirm releasing "Ana"
    And "Ana" is still taken

  @ui @smoke
  Scenario: Confirming the release frees the name
    Given the organizer has asked to release "Ana" from the organizer panel
    When the organizer confirms the release
    Then "Ana" is available again
    And Ana can claim the name "Ana"

  @api
  Scenario: The previous device loses access after the release
    When the organizer releases "Ana" from the organizer's device
    Then Beto's device no longer gets a result for "Ana"
    And Beto's device can claim another name

  @api @RF-13
  Scenario: The secret friend does not change after the release
    Given the secret friend assigned to "Ana" is known
    When the organizer releases "Ana" from the organizer's device
    And Ana claims the name "Ana" from Ana's device
    Then Ana gets the same secret friend as before

  @ui @RF-14
  Scenario: Whoever picks a released name spins the roulette again
    Given Beto has spun the roulette as "Ana"
    And the organizer has released "Ana"
    When Ana claims the name "Ana"
    Then Ana sees the roulette ready to spin

  @api
  Scenario: A device that is not an organizer cannot release a name
    When Carla releases "Ana" from Carla's device
    Then the request is rejected as "UNAUTHORIZED"
    And "Ana" is still taken
