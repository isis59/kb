# Client-Side Knowledge Base

A fully client-side knowledge base application with WYSIWYG editing, directory structure, full-text search, and custom JavaScript buttons.

## Features

✨ **WYSIWYG Editor** - Rich text editing with TipTap  
📁 **Directory Structure** - Create nested directories and articles  
🔍 **Full-text Search** - Fuzzy search with Fuse.js  
🎯 **Custom Buttons** - Add buttons that execute JavaScript code  
💾 **Persistent Storage** - Data saved to localStorage and optionally to server files  
🚀 **100% Client-Side** - No database required  

## Quick Start

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx          # Navigation tree
│   ├── Editor.jsx           # Article editor
│   ├── ArticleViewer.jsx    # Article display
│   ├── MenuBar.jsx          # Formatting toolbar
│   ├── SearchBar.jsx        # Search functionality
│   └── ButtonConfigurator.jsx # Custom button setup
├── store/
│   └── kbStore.js           # Zustand state management
├── App.jsx
├── main.jsx
└── index.css
```

## Architecture

### Tech Stack
- **React 18** - UI framework
- **Vite** - Build tool
- **TipTap** - WYSIWYG editor
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Fuse.js** - Fuzzy search
- **Lucide Icons** - UI icons

### Data Storage
- **Primary**: localStorage for instant access
- **Optional Server**: POST to `/api/kb/save` for file persistence
- **Format**: JSON structure with articles, directories, and buttons

## Usage

### Creating Content
1. Click "New Article" to create an article
2. Enter a title and write content using the WYSIWYG editor
3. Use "New Directory" to organize articles

### Custom Buttons
1. While editing an article, click "Add Button"
2. Enter a label and JavaScript code
3. The code will execute when users click the button
4. Available APIs: `alert()`, `console.log()`, and all global JS APIs

### Searching
- Use the search bar to find articles by title or content
- Supports fuzzy matching (typos are forgiven)

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Server Integration (Optional)

To enable server-side persistence, implement:

```javascript
POST /api/kb/save
Content-Type: application/json

{
  "articles": { /* article data */ },
  "directories": { /* directory data */ }
}
```

## License

MIT
