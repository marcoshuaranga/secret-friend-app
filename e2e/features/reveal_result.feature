@wip @ui @RF-10
Feature: See my secret friend
  As a participant
  I want to see my secret friend together with the exchange details
  So that I know who to buy a gift for, when, and how much to spend

  Scenario Outline: The result shows the exchange details that exist
    Given the event "Navidad 2026" has <date> as exchange date and <budget> as budget
    And Ana has claimed the name "Ana"
    When Ana reveals the secret friend
    Then Ana sees the secret friend's name
    And Ana sees the exchange date <shown_date>
    And Ana sees the budget <shown_budget>

    Examples:
      | date         | budget   | shown_date       | shown_budget     |
      | "2026-12-24" | "20 USD" | "2026-12-24"     | "20 USD"         |
      | "2026-12-24" | no value | "2026-12-24"     | nothing about it |
      | no value     | "20 USD" | nothing about it | "20 USD"         |
      | no value     | no value | nothing about it | nothing about it |
