# Luma
Experimental Minecraft Classic server implemented in TypeScript, then taken way too seriously. May or may not get somewhere.

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
- [ ] A kitchen sink style game mode demonstrating all features of Luma

Implemented CPE modules:
- MessageType

## Broad scope checklist
- [x] 0.30 protocol: let there be server software
- [x] "Game Mode" system: what makes Luma truly special
- [ ] CPE support: catching up with the community
- [ ] Luma Internal Goodies: catching up to speed with Minecraft, in a way
- [ ] "Luma Freebuild" game mode: what you're used to
- [ ] Plugin system: let game modes be further extendable
- [ ] Support, new nice things, etc...


# Acknowledgements
This project would have never reached any workable state if not for the following members of the ClassiCube discord:
- Vexyl
- AmogusPH
- UnknownShadow200, ey!

Special thanks to Markus "Notch" Persson for creating Minecraft (duh!)
Your dirty laundry (the classic protocol) is so much fun to build upon!