Game Mode System
================

_Warning: this system is provisional, details are subject to change_

_Last revision: March 26 2023_

The game mode system facilitates the ability to create arbitrary custom game logic within a specific world.

A game mode has full control over the world it is bound to.


## Writing a game mode

In order to be loaded, a game mode must contain a `main.ts` file, the default export of which is a class implementiong the `GameMode` interface.

Methods `setup` and `destroy` of the game mode are passed instances of the `World` to which the game mode is bound and the `MinecraftClassicServer` it is running on, both of which extend `EventEmitter`

`setup` is called upon initialization of the world the game mode is bound to, before any players can join. Here you should set up all event listeners required for the game mode's operation.
