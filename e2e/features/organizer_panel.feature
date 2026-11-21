@wip @RF-17
Feature: Follow the event from the organizer panel
  As an organizer
  I want to see who has already picked their name and who has seen their secret friend
  So that I can remind the rest of the group without spoiling any assignment

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego" created on the organizer's device
    And Ana has claimed the name "Ana" from Ana's device
    And Ana has fetched the secret friend
    And Beto has claimed the name "Beto" from Beto's device

  @ui @smoke
  Scenario: The panel shows the status of every participant
    When the organizer opens the organizer panel
    Then the organizer sees these statuses:
      | participant | status              |
      | Ana         | has seen the result |
      | Beto        | has picked the name |
      | Carla       | available           |
      | Diego       | available           |
    And the organizer sees that 1 of 4 participants have seen their secret friend

  @ui
  Scenario: The panel never shows a secret friend
    When the organizer opens the organizer panel
    Then the panel shows no secret friend of any participant

  @api @privacy
  Scenario: The panel data contains statuses but no assignment
    When the organizer requests the panel data from the organizer's device
    Then the response includes the status of every participant
    But the response includes no assignment

  @api @RF-16
  Scenario: A device that is not an organizer cannot see the panel
    When Ana requests the panel data from Ana's device
    Then the request is rejected as "UNAUTHORIZED"
