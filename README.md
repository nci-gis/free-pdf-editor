# Free PDF Editor

A lightweight, fully client-side PDF editor built as a static web application.  
All functionality runs directly in the browser — **no backend, no uploads, no tracking**.

This project focuses on simplicity, offline usage, and ease of deployment.

---

## ✨ Features

- View PDF documents directly in the browser
- Draw, annotate, and mark up PDF pages
- Client-side rendering (no server required)
- Works offline once loaded
- Simple static deployment

---

## 📌 Motivation & Attribution

This project was **inspired by and motivated by** the following open-source repository:

- **pdf-editor** by **ShizukuIchi**  
  https://github.com/ShizukuIchi/pdf-editor  

That project is licensed under the **MIT License**, which allows reuse, modification, and redistribution with attribution.

This repository respects and complies with the MIT License terms.  
While the implementation and structure may differ, the original project served as an important reference and inspiration.

---

## 📜 License

This project is released under the **MIT License**.

Portions of the ideas, design concepts, and approach were inspired by work originally authored by **ShizukuIchi (© 2020)** and licensed under the MIT License.

A copy of the original MIT License is included below, as required.

<details>
<summary><strong>MIT License</strong></summary>

The MIT License (MIT)

Copyright (c) 2020 ShizukuIchi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

</details>

---

## 🚀 Static Deployment

This project is designed to be deployed as a **static site**.

### Option 1: Local Usage

1. Clone or download this repository
2. Open `public/index.html` directly in **Chrome** or **Edge**
3. All features work immediately — no build step required

### Option 2: Static Hosting

You can deploy this project on any static hosting platform:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Local file system

Simply upload the contents of the `public/` directory (and referenced assets).

---

## 🗂 Project Structure

```text
├── public/
│ ├── index.html # Entry point
│ └── assets/ # Built/static assets
├── src/
│ ├── components/ # Svelte UI components
│ │ ├── Toolbar
│ │ ├── PDFPage
│ │ └── Drawing
│ ├── utils/ # Utility modules
│ └── assets/ # Icons and images
├── docs/ # Project documentation & analysis
└── README.md
```

### Key Directories

- **`src/components/`** – UI components (toolbar, PDF pages, drawing tools)
- **`src/utils/`** – Shared utility logic (see `src/utils/README.md`)
- **`public/`** – Static entry point and build output
- **`docs/`** – Design notes, refactor plans, and technical documentation

---

## 🔒 Privacy & Security

- No files are uploaded to any server
- PDFs are processed entirely in your browser
- No analytics, no tracking, no telemetry

---

## 🤝 Contributing

Contributions are welcome!

If you plan to submit a pull request:

- Keep changes client-side only
- Avoid adding backend dependencies
- Preserve license headers and attribution

---

## 🙏 Credits

- **ShizukuIchi** — original inspiration and reference project  
  https://github.com/ShizukuIchi/pdf-editor

---

## 📄 Disclaimer

This software is provided **“as is”**, without warranty of any kind.  
Use at your own risk.
