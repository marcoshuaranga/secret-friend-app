Feature: Pick my own name
  As a participant
  I want to pick my own name from the event list
  So that the app knows who I am and never makes me my own secret friend

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego"

  Rule: Every participant picks their own name and confirms it

    @RF-4 @ui @smoke
    Scenario: The list shows every participant as available
      When Ana opens the event link
      Then Ana sees the participants "Ana, Beto, Carla, Diego"
      And every participant is shown as available

    @RF-4 @ui
    Scenario: Picking a name asks for confirmation
      Given Ana opens the event link
      When Ana picks "Ana" from the list
      Then Ana is asked to confirm being "Ana"
      And "Ana" is still available

    @RF-4 @ui
    Scenario: Confirming the name claims it
      Given Ana opens the event link
      And Ana has picked "Ana" from the list
      When Ana confirms being "Ana"
      Then Ana sees the roulette
      And "Ana" is shown as taken to everyone else

    @RF-4 @ui
    Scenario: Cancelling the confirmation keeps the name available
      Given Ana opens the event link
      And Ana has picked "Beto" from the list
      When Ana cancels the confirmation
      Then Ana is back on the participant list
      And "Beto" is still available

  Rule: A claimed name cannot be taken from another device

    @RF-5 @ui
    Scenario: A taken name cannot be picked
      Given Ana has claimed the name "Ana"
      When Beto opens the event link
      Then Beto sees "Ana" marked as taken
      And Beto cannot pick "Ana"

    @RF-5 @api
    Scenario: The API rejects claiming a taken name
      Given Ana has claimed the name "Ana" through the API
      When Beto claims the name "Ana" through the API
      Then the claim is rejected as "name_taken"

    @RF-5 @api
    Scenario: Only one of two simultaneous claims for the same name succeeds
      When Ana and Beto claim the name "Carla" at the same time
      Then exactly one claim succeeds
      And the other claim is rejected as "name_taken"

  Rule: The device remembers who I am

    @RF-6 @ui
    Scenario: Reopening the link on the same device keeps my identity
      Given Ana has claimed the name "Ana"
      When Ana reopens the event link on the same device
      Then Ana is recognized as "Ana"
      And Ana is not asked to pick a name

    @RF-6 @ui
    Scenario: A new device does not inherit a claimed identity
      Given Ana has claimed the name "Ana"
      When Ana opens the event link on a new device
      Then Ana sees the participant list
      And "Ana" is shown as taken
