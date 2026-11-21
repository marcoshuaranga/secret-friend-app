@wip @ui
Feature: Spin the roulette
  As a participant
  I want to spin a casino roulette to discover my secret friend
  So that finding out who I give a gift to is a fun moment

  Background:
    Given an event with participants "Ana, Beto, Carla, Diego"
    And Ana has claimed the name "Ana"

  @RF-7
  Rule: Swiping down spins the roulette, and a button offers an accessible alternative

    @smoke
    Scenario: Swipe down to spin
      When Ana swipes down on the roulette
      Then the roulette spins
      And the roulette reveals a secret friend

    Scenario: Press the spin button instead of swiping
      When Ana presses the spin button
      Then the roulette spins
      And the roulette reveals a secret friend

    Scenario Outline: Other gestures do not spin the roulette
      When Ana swipes <direction> on the roulette
      Then the roulette does not spin

      Examples:
        | direction |
        | up        |
        | left      |
        | right     |

  @RF-8 @RF-9
  Rule: The roulette is only visual and always lands on the drawn result

    Scenario: The roulette never shows my own name
      When Ana spins the roulette
      Then the roulette only shows the names "Beto, Carla, Diego"

    Scenario: The roulette lands on the secret friend assigned by the server
      When Ana spins the roulette
      Then the roulette stops on the secret friend the server assigned to Ana

  @RF-10 @RF-15
  Rule: The reveal is festive, unless the participant prefers reduced motion

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

    Scenario: The roulette is silent by default
      When Ana spins the roulette
      Then no sound is played

    Scenario: Turning the sound on is remembered on the device
      Given Ana has turned the roulette sound on
      When Ana opens the roulette of another event on the same device
      Then the roulette sound is on

    @a11y
    Scenario: Reduced motion reveals the result without a long spin or confetti
      Given Ana prefers reduced motion
      When Ana presses the spin button
      Then the secret friend is revealed without a long spin
      And no confetti is shown

  @RF-14
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

    Scenario: Reopening the link shows the result without the roulette
      Given Ana has spun the roulette
      When Ana reopens the event link on the same device
      Then Ana sees the same secret friend
      But Ana does not see the roulette
      And no confetti is shown
