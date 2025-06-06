# Search Shortcut Browser Extension

A lightweight browser extension that enhances your web browsing experience by providing a quick way to focus on search inputs across any website using the familiar `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) keyboard shortcut.

## Features

- 🔍 Instantly focus on search inputs with `Ctrl+K` / `Cmd+K`
- ✨ Beautiful neon glow animation when focusing search inputs
- 🌐 Works across a wide range of websites
- 🎯 Smart search input detection
- 🚀 Lightweight and fast
- 🎨 Non-intrusive visual feedback

## Installation

### Chrome/Edge/Brave
1. Download the extension from the Chrome Web Store (coming soon)
2. Or install manually:
   - Clone this repository
   - Open Chrome/Edge/Brave and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory

### Firefox
1. Download from Firefox Add-ons (coming soon)
2. Or install manually:
   - Clone this repository
   - Open Firefox and go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in the extension directory

## Usage

1. Visit any website
2. Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac)
3. The nearest search input will be focused with a beautiful glow animation

## How It Works

The extension uses a comprehensive set of selectors to find search inputs on web pages, including:
- Standard HTML5 search inputs
- Common naming patterns (id, class, name attributes)
- Accessibility attributes (aria-label)
- International support (including Finnish word "hae")
- Common framework patterns (Angular forms)
- E-commerce specific patterns
- Various container patterns and form structures

The extension prioritizes visible search inputs and provides visual feedback through a smooth neon glow animation.

## Development

### Prerequisites
- Node.js
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/nikosalonen/search-shortcut.git

# Install dependencies
npm install

# Build the extension
npm run build
```

### Project Structure
```
search-shortcut/
├── src/
│   └── index.ts      # Main extension code
├── dist/             # Built extension files
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by common search shortcuts in modern web applications
- Built with TypeScript for better type safety and maintainability

