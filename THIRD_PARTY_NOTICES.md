# Third-party notices

## doomgeneric

- Project: <https://github.com/ozkl/doomgeneric>
- Revision used for source verification: `dcb7a8dbc7a16ce3dda29382ac9aae9d77d21284`
- Browser build source: <https://ozkl.github.io/doomgeneric/>
- License: GNU General Public License v2.0; see `third_party/doomgeneric/LICENSE`.

The vendored `doomgeneric.js`, `doomgeneric.wasm`, and `doomgeneric.data` files are
the Emscripten browser build published by the upstream project. The data package
contains the shareware IWAD and GUS patches needed for music playback.

## DOOM shareware data

`DOOM1.WAD` is the shareware episode data distributed by id Software. The copy in
this repository has SHA-256:

`1d7d43be501e67d927e415e0b8f3e29c3bf33075e859721816f652a526cac771`

The IWAD embedded in the upstream browser data package is byte-for-byte identical
to the repository copy. DOOM and related marks are property of their respective
owners. The shareware data is not covered by doomgeneric's GPL license.
