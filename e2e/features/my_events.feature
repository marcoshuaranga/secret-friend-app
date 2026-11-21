@wip @RF-20 @ui
Feature: See my events on this device
  As a participant or organizer
  I want the home page to list the events of this device
  So that I can go back to them without looking for the link

  Scenario: The home page lists the events created and joined on this device
    Given the event "Navidad 2026" was created on Ana's device
    And Ana has claimed the name "Ana" in the event "Cumpleaños de Beto"
    When Ana opens the home page
    Then Ana sees the events "Navidad 2026" and "Cumpleaños de Beto"
    And "Navidad 2026" is shown as organized by Ana

  Scenario: Opening an event from the list goes to that event
    Given Ana has claimed the name "Ana" in the event "Cumpleaños de Beto"
    When Ana opens "Cumpleaños de Beto" from the home page
    Then Ana sees the event "Cumpleaños de Beto"

  Scenario: Another device does not see my events
    Given the event "Navidad 2026" was created on Ana's device
    When Beto opens the home page on Beto's device
    Then Beto sees no events
    And Beto is offered to create an event
