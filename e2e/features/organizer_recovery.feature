@wip @RF-21
Feature: Recover the organizer access
  As an organizer who lost the device or its data
  I want to get back into the organizer panel with my password
  So that I can keep managing the event from any device

  Background:
    Given an event "Navidad 2026" created on the organizer's device with the password "turron-2026"

  @ui @smoke
  Scenario: The right password makes a new device an organizer
    When the organizer opens the organizer panel on a new device
    And the organizer enters the password "turron-2026"
    Then the organizer sees the organizer panel
    And the original device is still an organizer

  @ui
  Scenario: The event page offers organizer access
    When the organizer opens the event link on a new device
    And the organizer chooses to enter as the organizer
    Then the organizer is asked for the organizer password

  @api
  Scenario: A wrong password gives no access
    When someone logs in to the event with the password "polvoron"
    Then the request is rejected as "UNAUTHORIZED"

  Rule: Five wrong passwords in an hour block the login

    @api
    Scenario: The login is blocked after 5 wrong passwords
      Given 5 wrong passwords were entered for the event in the last hour
      When someone logs in to the event with the password "turron-2026"
      Then the request is rejected as "TOO_MANY_ATTEMPTS"

    @api
    Scenario: The login is allowed again after an hour
      Given 5 wrong passwords were entered for the event more than an hour ago
      When someone logs in to the event with the password "turron-2026"
      Then the login succeeds

  Rule: A matching browser is only a hint, never access

    @ui
    Scenario: The home page suggests the events of a matching browser
      Given the organizer cleared the data of the browser
      When the organizer opens the home page
      Then the organizer is asked whether they organize "Navidad 2026"
      And only the name and date of the event are shown

    @api
    Scenario: A matching browser without the password gets no access
      Given the organizer cleared the data of the browser
      When the organizer requests the panel data from the same browser
      Then the request is rejected as "UNAUTHORIZED"
