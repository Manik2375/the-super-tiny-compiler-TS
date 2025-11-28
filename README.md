# The super tiny compiler in TypeScript!

A TypeScript implementation of a minimal compiler that transforms LISP-style function calls into C syntax.

##  What it does

Transforms this:
```lisp
(add 2 (subtract 4 2))
```

Into this:
```c
add(2, subtract(4, 2));
```


## Features

- **Tokenizer**: Lexical analysis of input
- **Parser**: Builds Abstract Syntax Tree (AST)
- **Transformer**: Converts LISP AST to C AST
- **Code Generator**: Outputs C code
- **Full TypeScript**: Type-safe implementation with proper interfaces


## Usage

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the example
npm run start
```

##  Attribution

This project is a TypeScript adaptation of [The Super Tiny Compiler](https://github.com/jamiebuilds/the-super-tiny-compiler) by @jamiebuilds

### Changes Made
- Converted from JavaScript to TypeScript
- Added comprehensive type definitions
- Separated types into dedicated module
- Added ES module support

## License

This derivative work is also licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

##  Contributing

This is a learning project. Feel free to fork and experiment!
