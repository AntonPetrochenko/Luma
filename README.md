# Luma
Experimental Minecraft Classic server implemented in TypeScript, then taken way too seriously. May or may not get somewhere.

The goal of this project is to create a highly extensible Minecraft Classic server.

Luma is not meant to be a competitor to MCGalaxy. My idea behind Luma is "what if Minecraft Classic continued development as it's own game?" What I saw in it is potential for customizability. The extensions that the community had developed along the way create potential for a powerful, albeit quirky, platform for creating mini-games, kind of like Roblox. There are ways of almost completely redefining the appearance of the game, while still being confined to the style of Minecraft.

So, the general idea is to not implement "Minecraft Classic 0.30" per se, as other servers do, but rather to create a platform on which several "game modes" defined outside of the server can be implemented.

Similarly to how Minetest is split into "minetest" and "minetest game" (+ a thousand other games) - an engine and a game built on top it, Luma is going to be split into "Luma" and "Luma Freebuild" (+ many more game modes made by you!)

This project also intends to "backport" some later-game technical features into Classic, such as entities (...really?) and block states (redstone? eh, don't count on it)

## Current state of the project
- Normal 0.30 protocol implemented in full
- First iteration of the Game Mode system is in place. Requires further work.
- Multiworld

Ongoing things:
- Entities!
- CPE time!
- Events for everything

Future important tasks:
- [ ] Entities

- CPE implementation:
Negotiates, pretends to implement EmoteFix, that's it.

## Broad scope checklist
- [x] 0.30 protocol: let there be server software
- [x] "Game Mode" system: what makes Luma truly special
- [ ] CPE support: catching up with the community
- [ ] Luma Internal Goodies: catching up to speed with Minecraft, in a way
- [ ] "Luma Freebuild" game mode: what you're used to
- [ ] Plugin system: let game modes be further extendable
- [ ] Support, new nice things, etc...
