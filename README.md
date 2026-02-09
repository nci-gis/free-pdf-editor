# Free PDF Editor

Edit PDFs right in your browser. No installs. No uploads. No tracking.

- Works offline after you download it
- Your files stay on your computer
- Simple, lightweight, and fast

---

## Download and use (3 easy steps)

1) Download the latest release
   - Go to the Releases page and download the newest ZIP file

2) Extract the ZIP file
   - Right-click the ZIP and choose "Extract All"

3) Open the app
   - Open the extracted folder and double-click `index.html`
   - Recommended browsers: Chrome or Edge

That is it. Load a PDF and start editing.

---

## If the app does not open correctly

Some browsers limit features when opening files directly from your computer.

Try these fixes:

- Use Chrome or Edge
- If you still have issues, run a simple local web server (see "Static Deployment" below)

---

## What you can do

- Open and view PDFs
- Draw, annotate, and mark up pages
- Simple text editing (adds text on top of the PDF)
- Work completely offline

---

## Privacy and security

- No files are uploaded
- Everything happens in your browser
- No analytics or tracking

---

## Static Deployment (optional)

You can also host this as a simple static website:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Any local or shared web server

Upload the contents of the `dist/` folder.

---

## Credits and attribution

This project was inspired by:

- pdf-editor by ShizukuIchi
  <https://github.com/ShizukuIchi/pdf-editor>

This repository respects the MIT License terms of the original project.

---

## License

This project is released under the MIT License.

Portions of the ideas, design concepts, and approach were inspired by work
originally authored by ShizukuIchi (c 2020) and licensed under the MIT License.

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

## Third-party dependencies

- Dependency overview: `docs/Dependencies.md`
- License texts: `3rd-party-licenses.md.md`

---

## For developers

Project structure:

```text
public/
  index.html  # Entry point
  assets/     # Built/static assets
src/
  components/ # Svelte UI components
  utils/      # Utility modules
  assets/     # Icons and images
docs/          # Project documentation
README.md
```

---

## Disclaimer

This software is provided "as is", without warranty of any kind.

This project is intended for personal, educational, and legitimate document
editing purposes. Users are responsible for ensuring they have the legal right
to view or edit any PDF documents they use with this tool.

Editing certain documents (signed, certified, official, or legally binding
PDFs) may invalidate their legal status. The authors and contributors assume no
responsibility for misuse of the software or for any consequences resulting
from edited documents.

This tool does not attempt to bypass DRM, encryption, or document security
restrictions.
