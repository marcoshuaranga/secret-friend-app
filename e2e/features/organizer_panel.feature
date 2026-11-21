@RF-15 @wip
Feature: Follow the event from the organizer panel
  As an organizer
  I want to see who has already picked their name and who has seen their secret friend
  So that I can remind the rest of the group without spoiling any assignment

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego"
    And Ana has claimed the name "Ana" through the API
    And Ana has fetched the secret friend
    And Beto has claimed the name "Beto" through the API

  @ui @smoke
  Scenario: The panel shows the status of every participant
    When the organizer opens the organizer panel with the admin key
    Then the organizer sees these statuses:
      | participant | status    |
      | Ana         | revealed  |
      | Beto        | taken     |
      | Carla       | available |
      | Diego       | available |

  @ui
  Scenario: The panel never shows a secret friend
    When the organizer opens the organizer panel with the admin key
    Then the panel shows no secret friend of any participant

  @api @privacy
  Scenario: The panel data contains statuses but no assignment
    When the organizer requests the panel data with the admin key
    Then the response includes the status of every participant
    But the response includes no assignment

  @api
  Scenario Outline: The panel cannot be opened without the right admin key
    When someone requests the panel data <credentials>
    Then the request is denied as "unauthorized"

    Examples:
      | credentials                         |
      | without an admin key                |
      | with a wrong admin key              |
      | with the admin key of another event |
