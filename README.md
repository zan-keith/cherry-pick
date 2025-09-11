# Cherry-Pick Scraper Extension

> A Chrome extension for quick scraping of common elements from web pages.

### Features
- **Automatic Identifier Detection:** Finds common classes, attributes, or tags among selected elements.
- **JavaScript Snippet Generation:** Creates a JS snippet to select and scrape the elements.
- **One-Click Scraping:** Press the "Scrape" button to copy the data from all matched elements.
---
### Chrome Installation
1. Download the ZIP file from the Releases section. 
2. Drag and drop the ZIP file onto the Chrome Extensions page (`chrome://extensions`) to install the extension.

### How It Works
1. **Activate the Extension:** Click the Cherry-Pick icon in your browser.
2. **Select Elements:** Use the mouse to highlight and select elements you want to scrape.
3. **Scrape Elements:** Click the "Scrape Elements" button in the popup. The extension will:
   - Find common identifiers.
   - Generate a JS selector snippet.
   - Copy the scraped data to your clipboard.

##### Example Use Case
Scrape all product names, prices, or links from a listing page by simply selecting a few examples.

---
### Developer Installation
1. Clone repo 
`git clone https://github.com/zan-keith/cherry-pick.git`.
2. Run `pnpm install` to install dependencies.
3. Run `pnpm dev` to build the extension.
4. Load the `build/chrome-mv3-dev` folder as an unpacked extension in Chrome.

###### Development
- Built with [Plasmo](https://docs.plasmo.com/) and [React](https://react.dev/).
- Uses [Tailwind CSS](https://tailwindcss.com/) for styling.

#### Contributing
Pull requests and suggestions are welcome!

#### License
MIT