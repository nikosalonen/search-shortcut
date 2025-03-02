# Search Focus Browser Extension

A lightweight browser extension that adds a universal search shortcut (Ctrl+K / Cmd+K) to any webpage. The extension intelligently finds and focuses on the search input field, making navigation more efficient.

## Features

- Universal keyboard shortcut (Ctrl+K on Windows/Linux, Cmd+K on macOS)
- Smart search input detection using multiple strategies
- Supports various search input patterns across different websites
- Works with both English and Finnish language indicators
- Prevents conflicts with browser's default shortcuts

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Build the extension with `npm run build`
4. Load the extension from the `dist` directory in your browser

## Development

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Run the extension in development mode
npm run dev
```

## Technical Details

The extension uses a comprehensive set of selectors to identify search inputs, including:
- Standard search inputs
- ARIA-labeled elements
- Role-based search forms
- Common class and ID patterns
- E-commerce specific patterns
- Multilingual support (English/Finnish)

## License

MIT License - See LICENSE file for details

## Author

Niko Salonen

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

