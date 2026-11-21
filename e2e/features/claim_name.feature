@wip
Feature: Pick my own name
  As a participant
  I want to pick my own name from the event list
  So that my device is linked to me and I can see my secret friend

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego"

  @RF-4
  Rule: Every participant picks their own name and confirms it

    @ui @smoke
    Scenario: The list shows every participant as available
      When Ana opens the event link
      Then Ana sees the participants "Ana, Beto, Carla, Diego"
      And every participant is shown as available

    @ui
    Scenario: Picking a name asks for confirmation
      Given Ana has opened the event link
      When Ana picks "Ana" from the list
      Then Ana is asked to confirm being "Ana"
      And "Ana" is still available

    @ui
    Scenario: Confirming the name claims it
      Given Ana has opened the event link
      And Ana has picked "Ana" from the list
      When Ana confirms being "Ana"
      Then Ana sees the roulette
      And "Ana" is shown as taken to everyone else

    @ui
    Scenario: Cancelling the confirmation keeps the name available
      Given Ana has opened the event link
      And Ana has picked "Beto" from the list
      When Ana cancels the confirmation
      Then Ana is back on the participant list
      And "Beto" is still available

  @RF-5
  Rule: A name claimed on one device cannot be taken from another

    @ui
    Scenario: A taken name cannot be picked
      Given Ana has claimed the name "Ana"
      When Beto opens the event link
      Then Beto sees "Ana" marked as taken
      And Beto cannot pick "Ana"

    @api
    Scenario: The API rejects claiming a taken name
      Given Ana has claimed the name "Ana" from Ana's device
      When Beto claims the name "Ana" from Beto's device
      Then the claim is rejected as "NAME_TAKEN"

    @api
    Scenario: Only one of two simultaneous claims for the same name succeeds
      When Ana and Beto claim the name "Carla" at the same time from their own devices
      Then exactly one claim succeeds
      And the other claim is rejected as "NAME_TAKEN"

  @RF-6
  Rule: The device is the identity, and it holds one name per event

    @api
    Scenario: A device cannot claim a second name in the same event
      Given Ana has claimed the name "Ana" from Ana's device
      When Ana claims the name "Beto" from Ana's device
      Then the claim is rejected as "ALREADY_CLAIMED"
      And "Beto" is still available

    @api
    Scenario: Claiming my own name again changes nothing
      Given Ana has claimed the name "Ana" from Ana's device
      When Ana claims the name "Ana" from Ana's device
      Then the claim succeeds
      And "Ana" is still claimed by Ana's device

    @ui
    Scenario: Reopening the link on the same device keeps my identity
      Given Ana has claimed the name "Ana"
      When Ana reopens the event link on the same device
      Then Ana is recognized as "Ana"
      And Ana is not asked to pick a name

    @ui @RF-22
    Scenario: Another browser counts as another device
      Given Ana has claimed the name "Ana"
      When Ana opens the event link in another browser
      Then Ana sees the participant list
      And Ana sees "Ana" marked as taken
      And Ana is told that another browser counts as another device and the organizer can release the name
