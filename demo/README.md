# SVG Toolbelt Demo

This directory contains the local development demo for svg-toolbelt.

## Structure

```
demo/
├── index.html         # Main demo page
├── serve.cjs          # Node.js development server
└── examples/          # Example implementations
    ├── simple.html    # Basic usage example
    └── multiple.html  # Multiple SVGs example
```

## Usage

From the project root:

```bash
# Build and start demo server
npm run demo

# Just start the server (if already built)
npm run serve

# Build in watch mode for development
npm run dev
```

The demo will be available at http://localhost:8080

## Features

The demo includes:

- Live configuration panel for testing all svg-toolbelt features
- Multiple diagram types (flowchart, sequence, state, class)
- Touch, mouse, and keyboard interaction examples
- Development tools and console logging
- Real-time feature toggling

## Development

The server serves files from the project root, allowing access to:

- Built library files in `/dist/`
- Source files in `/src/`
- Demo files in `/demo/`

This setup enables easy testing of the library during development.
