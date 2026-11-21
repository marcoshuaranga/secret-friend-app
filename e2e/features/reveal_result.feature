@ui
Feature: See my secret friend
  As a participant
  I want to see my secret friend together with the exchange details
  So that I know who to buy a gift for, when, and how much to spend

  Background:
    Given Ana has claimed the name "Ana" in the event "Navidad 2026"

  @RF-10
  Scenario Outline: The result shows the exchange details that exist
    Given the event has <date> as exchange date and <budget> as budget
    When Ana reveals the secret friend
    Then Ana sees the secret friend's name
    And Ana sees the exchange date <shown date>
    And Ana sees the budget <shown budget>

    Examples:
      | date         | budget   | shown date          | shown budget        |
      | "2026-12-24" | "20 USD" | "2026-12-24"        | "20 USD"            |
      | "2026-12-24" | no value | "2026-12-24"        | nothing about it    |
      | no value     | "20 USD" | nothing about it    | "20 USD"            |
      | no value     | no value | nothing about it    | nothing about it    |

  @RF-6
  Scenario: Revisiting the link shows the result straight away
    Given Ana has revealed the secret friend
    When Ana reopens the event link on the same device
    Then Ana sees the same secret friend without spinning the roulette

  @RF-9 @RF-13
  Scenario: The reveal animation can be replayed with the same result
    Given Ana has revealed the secret friend
    And Ana reopens the event link on the same device
    When Ana replays the reveal animation
    Then the roulette stops on the same secret friend
