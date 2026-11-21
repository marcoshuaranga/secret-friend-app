@ui
Feature: Spin the roulette
  As a participant
  I want to spin a roulette to discover my secret friend
  So that finding out who I give a gift to is a fun moment

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego"
    And Ana has claimed the name "Ana"

  Rule: Swiping down spins the roulette, and a button offers an accessible alternative

    @RF-7 @smoke
    Scenario: Swipe down to spin
      When Ana swipes down on the roulette
      Then the roulette spins
      And the roulette reveals a secret friend

    @RF-7
    Scenario: Press the spin button instead of swiping
      When Ana presses the spin button
      Then the roulette spins
      And the roulette reveals a secret friend

    @RF-7
    Scenario Outline: Other gestures do not spin the roulette
      When Ana swipes <direction> on the roulette
      Then the roulette does not spin

      Examples:
        | direction |
        | up        |
        | left      |
        | right     |

  Rule: The roulette is only visual and always lands on the drawn result

    @RF-8
    Scenario: The roulette never shows my own name
      When Ana spins the roulette
      Then the roulette only shows the names "Beto, Carla, Diego"

    @RF-9
    Scenario: The roulette lands on the secret friend assigned by the server
      When Ana spins the roulette
      Then the roulette stops on the secret friend the server assigned to Ana

  Rule: The reveal is festive, unless the participant prefers reduced motion

    @RF-10
    Scenario Outline: Celebrate the reveal
      Given the phone <vibration> vibration
      When Ana spins the roulette
      Then the secret friend's name is highlighted
      And confetti is shown
      And the phone <vibrates>

      Examples:
        | vibration        | vibrates         |
        | supports         | vibrates briefly |
        | does not support | does not vibrate |

    @a11y
    Scenario: Reduced motion reveals the result without a long spin or confetti
      Given Ana prefers reduced motion
      When Ana presses the spin button
      Then the secret friend is revealed without a long spin
      And no confetti is shown

  @RF-14 @wip
  Rule: The roulette spins only once

    Scenario Outline: Trying to spin again after the reveal does nothing
      Given Ana has spun the roulette
      When Ana tries to spin the roulette again by <gesture>
      Then the roulette does not spin again
      And Ana still sees the same secret friend

      Examples:
        | gesture                  |
        | swiping down             |
        | pressing the spin button |

    Scenario: Reopening the link does not offer a new spin
      Given Ana has spun the roulette
      When Ana reopens the event link on the same device
      Then Ana is not offered to spin the roulette
