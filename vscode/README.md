# Plankalkül for Visual Studio Code

Language support for **Plankalkül**, the world's first high-level programming language, designed by Konrad Zuse in 1945.

## Features

- **Syntax Highlighting** for both linear (`.pk`) and 2D notation (`.pk2d`)
- **2D Notation Editor** - edit Plankalkül in Zuse's original tabular format with V/K/S rows
- **Language Server Protocol** - diagnostics, hover info, and go-to-definition
- **Compile to C** - generate executable C code from Plankalkül source

## File Types

| Extension | Description |
|-----------|-------------|
| `.pk` | Linear notation (modern readable format) |
| `.pk2d` | 2D tabular notation (Zuse's original format) |

## 2D Notation

Zuse wrote Plankalkül in a unique 2D tabular format where each expression spans multiple lines:

```
|       | V0 + V1 | => | R0 |
| V     | 0    1  |    | 0  |
| K     |         |    |    |
| S     | 1.n  1.n|    | 1.n|
```

The extension includes a custom 2D editor that renders this notation properly.

## Commands

- `Plankalkül: Compile to C` - Generate C code from the current file
- `Plankalkül: Show 2D Preview` - Preview linear notation as 2D
- `Plankalkül: Convert to 2D Notation` - Convert `.pk` to `.pk2d`
- `Plankalkül: Convert to Linear Notation` - Convert `.pk2d` to `.pk`

## Configuration

| Setting | Description |
|---------|-------------|
| `plankalkul.compiler.path` | Path to the Plankalkül compiler |
| `plankalkul.lsp.path` | Path to the LSP server |
| `plankalkul.editor2d.showGrid` | Show grid lines in 2D editor |
| `plankalkul.editor2d.fontSize` | Font size in 2D editor |

## Requirements

For full functionality, install the [Plankalkül compiler](https://github.com/Zaneham/plankalkul-compiler).

## About Plankalkül

Plankalkül ("Plan Calculus") was designed by German engineer Konrad Zuse between 1942-1945. It included advanced features like:

- Structured data types (including nested records)
- Array operations with component access
- Logical quantifiers (for-all, exists)
- Iterators and filters
- Chess programs (ZIA-0367, ZIA-0368)

The language was never implemented during Zuse's lifetime. This project brings it to life 80 years later.

## Links

- [Compiler Repository](https://github.com/Zaneham/plankalkul-compiler)
- [Package Manager (ppm)](https://github.com/Zaneham/ppm)
- [Konrad Zuse Internet Archive](https://zuse.zib.de)
- [Original Manuscripts (ZIA)](https://zuse.zib.de)

## License

MIT
