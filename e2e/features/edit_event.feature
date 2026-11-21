@wip @RF-19
Feature: Edit or delete the event
  As an organizer
  I want to fix the event details or remove the event
  So that the group always sees the right information

  Background:
    Given an event "Navidad 2026" with participants "Ana, Beto, Carla" created on the organizer's device

  @ui
  Scenario: The organizer edits the name, date and budget
    When the organizer changes the event to:
      | name         | date       | budget |
      | Navidad 2027 | 2027-12-24 | 30 USD |
    Then anyone opening the event link sees the name "Navidad 2027", the date "2027-12-24" and the budget "30 USD"

  @ui
  Scenario: The participant list cannot be edited after the draw
    When the organizer opens the organizer panel
    Then the organizer is not offered to change the participants

  @ui
  Scenario: Deleting the event requires typing its name
    When the organizer deletes the event confirming with the name "Navidad 2026"
    Then the event link shows that the event does not exist

  @ui
  Scenario: A wrong confirmation does not delete the event
    When the organizer tries to delete the event confirming with the name "Navidad"
    Then the event is not deleted

  @api
  Scenario Outline: A device that is not an organizer cannot change the event
    When Ana <action> from Ana's device
    Then the request is rejected as "UNAUTHORIZED"
    And the event is unchanged

    Examples:
      | action                             |
      | renames the event to "Otro nombre" |
      | deletes the event                  |
