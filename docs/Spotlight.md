# Anatomy of a command palette

<!-- Ref: https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/ -->

### Rule #1: Make your command palette available everywhere

- Capture keyboard events with an ad-hoc event listener, or by using a library dedicated to it, such as [Mousetrap](https://craig.is/killing/mice).
- Bind the keyboard shortcut at the top-level of the application.
- Ensure that the palette not only appears, it also disappears when the user presses the shortcut again.

### Rule #2: Make your command palette central

- Architect the code so I can call any command from anywhere in the application.

### Rule #3: Make your command palette omnipotent(?)

### Rule #4: Build flexibility into your command palette

- Forgiving input parsing.
- Fuzzy matching.

### Rule #5: Make commands contextually relevant

- Dynamically adjust the available commands based on the current context of the application.
