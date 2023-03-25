# Luma
Experimental Minecraft Classic server implemented in TypeScript, then taken way too seriously. May or may not get somewhere.

The goal of this project is to create a highly extensible Minecraft Classic server.

The general idea is to not implement "Minecraft Classic 0.30" per se, as other servers do, but rather to create a platform on which several "game modes" defined outside of the server can be implemented. 

Similarly to how Minetest is split into "minetest" and "minetest game" (+ a thousand other games) - an engine and a game built on top it, Luma is going to be split into "Luma" and "Luma Freebuild" (+ many more game modes made by you!)

This project also intends to "backport" some later-game technical features into Classic, such as entities (...really?) and block states (redstone? eh, don't count on it)

## Checklist

Broad scope development phases:
- [x] 0.30 protocol: let there be server software
- [ ] "Game Mode" system: what makes Luma truly special
- [ ] CPE support: catching up with the community
- [ ] Luma Internal Goodies: catching up to speed with Minecraft, in a way
- [ ] "Luma Freebuild" game mode: what you're used to
- [ ] Plugin system: let game modes be further extendable
- [ ] Support, new nice things, etc...

Current tasks:
- Implement game mode loading
- Proper multiworld (better to get this done as early as possible)
- Persistent level storage. Gonna need a custom format for the goodies.

Future important tasks:
- [ ] Implement ray-casting for CPE PlayerClick