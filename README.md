# Luma
Experimental Minecraft Classic server implemented in TypeScript, then taken way too seriously. May or may not get somewhere.

# [Check out the entities branch!](https://github.com/AntonPetrochenko/Luma/tree/entities)

[Project manifesto](MANIFESTO.md)

## Useful links

- [Minecraft Classic protocol specification](https://wiki.vg/Classic_Protocol)
- [Classic Protocol Extension (CPE) specification](https://wiki.vg/Classic_Protocol_Extension)

## Current state of the project
- Normal 0.30 protocol implemented in full
- Worlds fully interactive, synced between clients, but not persisted.
- First iteration of the Game Mode system is in place. Requires further work.
- Naturally, multiworld support
- CPE support. CPE modules can be defined, including the ability for creating fallback logic for clients not supporting specific CPE functionality.

Ongoing things:
- Entities! Groundwork laid down, collision designed and partially implemented.
- Block updates
- Powerful helpers for querying multi-block structures (think Nether Reactor and Wither/Golem summons)
- Events for everything

Future important tasks:
- [ ] More CPE modules. Ideally, everything that ClassiCube supports.

Implemented CPE modules:
- MessageType

## Broad scope checklist and general random ideas
- [x] 0.30 protocol: let there be server software
- [x] "Game Mode" system: what makes Luma truly special
- [x] CPE support: catching up with the community
- [ ] More CPE extensions: catching up with the community
- [ ] Luma Internal Goodies: catching up to speed with Minecraft, in a way
- [ ] "Luma Freebuild" game mode: what you're used to
- [ ] "Kitchen Sink" game mode: a bit of everything, to show off the power. Infiniminer, maybe?
- [ ] Plugin system: let game modes be further extendable
- [ ] Support, new nice things, etc...


# Acknowledgements
Special thanks to UnknownShadow200 for creating ClassiCube, the biggest and bestest 0.30 client ever. Without ClassiCube this project wouldn't have existed.

This project would have never reached any workable state if not for the following members of the ClassiCube discord:
- Vexyl
- AmogusPH

And naturally, thanks to Markus "Notch" Persson for creating Minecraft (duh!)
Your dirty laundry (the classic protocol) is so much fun to build upon!
