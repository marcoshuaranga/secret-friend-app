@wip @RF-3 @ui
Feature: Share the event link
  As an organizer
  I want to copy or share the event link right after creating the event
  So that I can send it to my group through any chat app

  Scenario: Copy the link to the clipboard
    Given the organizer has just created the event "Navidad 2026" with participants "Ana, Beto, Carla"
    When the organizer copies the event link
    Then the clipboard contains the event link
    And the organizer is told the link was copied

  Scenario: Share through the device share menu when it is available
    Given the organizer's device supports native sharing
    And the organizer has just created the event "Navidad 2026" with participants "Ana, Beto, Carla"
    When the organizer shares the event link
    Then the device share menu opens with the event link

  Scenario: Only copying is offered when native sharing is unavailable
    Given the organizer's device does not support native sharing
    And the organizer has just created the event "Navidad 2026" with participants "Ana, Beto, Carla"
    When the organizer looks at the created event
    Then the organizer can copy the event link
    But the organizer is not offered the device share menu
