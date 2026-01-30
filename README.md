# Plankalkül IDE

Developer tools for Konrad Zuse's Plankalkül (1945) — the world's first high-level programming language.

*Building autocomplete for a language designed before the transistor was invented. Only 80 years late.*

---

## Wait, What?

Yes, this is a real IDE. Yes, it has syntax highlighting, hover documentation, and autocomplete. Yes, the language it supports was designed in the 1940s and never actually ran on hardware until the year 2000.

I'm not the hero of this story — that honour belongs to **Prof. Raúl Rojas** and the **Freie Universität Berlin** team who first implemented Plankalkül in 2000, the archivists at the **Konrad Zuse Internet Archive** who preserved the manuscripts, and researchers like **Bram Bruines** who formalized the semantics.

I'm just someone who looked at a language older than FORTRAN, COBOL, and LISP combined and thought: "You know what this needs? *IntelliSense*."

## Components

### VS Code Extension (`vscode/`)

Full IDE experience for Plankalkül:

- **Syntax highlighting** for linear (`.pk`) and 2D (`.pk2d`) notation
- **2D Grid Editor** — Edit Zuse's original notation as an interactive spreadsheet. It's like Excel, but for a language from 1945. We've come full circle.
- **Diagnostics** — Real-time error reporting, because even octogenarian languages deserve red squiggly lines
- **Completions** — All 7 loop variants at your fingertips (W through W6, because one loop wasn't enough for Zuse)
- **Hover info** — Finally understand what `W3` does without consulting a 1972 German manuscript

### Language Server (`lsp/`)

An LSP server. For Plankalkül. Written in OCaml.

If you'd told Konrad Zuse in 1945 that one day there would be a *language server protocol* providing *real-time semantic analysis* of his programming language, he'd probably have asked what a "server" was. And honestly, fair enough — he was still working with relays.

Features:
- Diagnostics from the actual compiler
- Hover documentation with historical context
- Completions for keywords, variables, and plans
- Document symbols for navigation

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [OCaml](https://ocaml.org/) (4.14+) with opam
- [Plankalkül Compiler](https://github.com/Zaneham/plankalkul-compiler)
- A sense of historical wonder

### Build VS Code Extension

```bash
cd vscode
npm install
npm run compile
```

### Build LSP Server

```bash
cd lsp
opam install . --deps-only
dune build
```

## Usage

### Linear Notation (`.pk`)

The sensible, horizontal notation that most implementations use:

```plankalkul
; Factorial — because every language demo needs one
factorial (V0) => R0 {
  1 => R0
  W1(V0) => Z0 {
    R0 * (Z0 + 1) => R0
  }
}
```

### 2D Notation (`.pk2d`)

Zuse's original notation. It's two-dimensional. Yes, really.

Open any `.pk2d` file to see the interactive grid editor:

```
 | V + V => R
V|  0   1      0
K|
S|  i   i      i
```

The grid shows:
- **Expression row** ( | ): The computation itself
- **V row**: Variable indices (which V? which Z? which R?)
- **K row**: Component indices for structured types
- **S row**: Type annotations

Zuse essentially invented a spreadsheet for programming. In the 1940s. On paper.

## Commands

- `Plankalkül: Compile to C` — Generate C code (because Zuse's relay computers are hard to source these days)
- `Plankalkül: Show 2D Preview` — See your linear code in Zuse's original 2D format
- `Plankalkül: Convert to 2D` — Transform linear notation to 2D
- `Plankalkül: Convert to Linear` — Transform 2D to linear (for the faint of heart)

## Configuration

```json
{
  "plankalkul.lsp.path": "/path/to/plankalkul-lsp",
  "plankalkul.compiler.path": "/path/to/plankalkul",
  "plankalkul.editor2d.showGrid": true,
  "plankalkul.editor2d.fontSize": 14
}
```

## Acknowledgements

This project exists because brilliant people did the hard work decades before me:

**Prof. Raúl Rojas and the Freie Universität Berlin team** — They created the first working implementation of Plankalkül in 2000, proving that Zuse's design actually worked. Fifty-five years after it was designed. Everything here stands on their shoulders.

**The Konrad Zuse Internet Archive** — For preserving the original manuscripts. Without archivists, there is no history.

**Bram Bruines** — For the formal semantics that let us reason about the language precisely rather than just guessing.

**Konrad Zuse** — For looking at the state of computing in 1945 and thinking "I can do better than this." He was right.

I'm just someone who thought "what if I added a language server?" That's not genius. That's just stubbornness and too much free time.

## Author

**Zane Hambly** (2025-2026)
- Email: Zanehambly@gmail.com
- GitHub: [@Zaneham](https://github.com/Zaneham)

## License

MIT — See [LICENSE](LICENSE)

## See Also

### This Project
- [Plankalkül Compiler](https://github.com/Zaneham/plankalkul-compiler) — The OCaml compiler powering this IDE

### Historical Resources
- [Konrad Zuse Internet Archive](https://zuse.zib.de) — Original manuscripts (ZIA-0367, ZIA-0368, ZIA-0410)
- [Rojas et al. (2000)](http://www.zib.de/zuse/Inhalt/Programme/Plankalkuel/Plankalkuel-Report/Plankalkuel-Report.htm) — First implementation, FU Berlin
- [Bruines (2010)](https://www.cs.vu.nl/~dick/Bruines.pdf) — Formal semantics

### Other Implementations
- [Hovestar Plankalkül](http://www.hovestar.com/res/plankalkul/) — Reference implementation
- [FU Berlin Tools](https://www.zib.de/zuse/Inhalt/Programme/Plankalkuel/) — Original 2000 implementation

---

*"Fin" — as Zuse would say*

*(That's Plankalkül for "return". We have syntax highlighting for it now. The future is weird.)*
