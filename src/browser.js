import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const iconDir = path.resolve(appRoot, 'src/sf-symbols')
const outputPath = path.resolve(appRoot, 'dist/index.html')

async function main() {
  const iconNames = await loadIconNames()

  if (iconNames.length === 0) {
    throw new Error(`No icons found in ${path.relative(appRoot, iconDir)}`)
  }

  const html = renderHtml(iconNames)

  await fs.writeFile(outputPath, html, 'utf8')

  console.log(
    `Wrote icon browser for ${iconNames.length} icon(s) -> ${path.relative(appRoot, outputPath)}`,
  )
  console.log(
    'Open the file directly in a browser or serve the directory to avoid file:// CORS quirks.',
  )
}

async function loadIconNames() {
  const entries = await fs.readdir(iconDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

function renderHtml(iconNames) {
  const safeJson = JSON.stringify(iconNames).replace(/</g, '\\u003c')
  const relativeIconDir = path
    .relative(path.dirname(outputPath), iconDir)
    .split(path.sep)
    .join('/')
  const iconUrlPrefix = relativeIconDir.endsWith('/')
    ? relativeIconDir
    : `${relativeIconDir}/`

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SF Symbols Browser</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0c111f;
      --panel: #0f172a;
      --muted: #8ba0c2;
      --card: #111a30;
      --border: #1f2a44;
      --accent: #5dd39e;
      --icon-size: 72px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Inter var", "SF Pro Text", -apple-system, system-ui, sans-serif;
      background: radial-gradient(circle at 12% 20%, #14213c 0, #0c111f 35%, #080c16 70%);
      color: #e9eefc;
      min-height: 100vh;
    }
    .shell {
      max-width: 1400px;
      margin: 0 auto;
      padding: 28px 22px 40px;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    h1 {
      margin: 4px 0 6px;
      letter-spacing: -0.4px;
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 12px;
      color: var(--muted);
      margin: 0;
    }
    .lede {
      margin: 0;
      color: #c8d4f2;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 10px 12px;
    }
    .control {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: var(--muted);
      font-size: 13px;
      min-width: 200px;
    }
    .control input[type="search"],
    .control input[type="range"] {
      appearance: none;
      width: 100%;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: #fff;
      padding: 9px 12px;
      font-size: 14px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .control input[type="search"]:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(93, 211, 158, 0.18);
    }
    .range-row {
      display: flex;
      gap: 8px;
      align-items: center;
      color: #d5def5;
    }
    .range-row span {
      display: inline-block;
      width: 40px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .status {
      margin: 12px 0 6px;
      color: var(--muted);
      font-size: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      color: inherit;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }
    .card:focus-visible {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(93, 211, 158, 0.18);
    }
    .card:hover {
      border-color: rgba(93, 211, 158, 0.5);
      transform: translateY(-1px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }
    .preview {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
      border: 1px solid var(--border);
      display: grid;
      place-items: center;
    }
    .preview img {
      width: var(--icon-size);
      height: var(--icon-size); 
    }
    @media (prefers-color-scheme: dark) {
      .preview img {
        filter: invert(1);
      }
    }
    .label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .label .name {
      font-size: 15px;
      font-weight: 600;
      color: #f6f9ff;
      word-break: break-all;
    }
    .label .file {
      color: var(--muted);
      font-size: 12px;
    }
    .pill {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(93, 211, 158, 0.14);
      color: #c2f0dd;
      border: 1px solid rgba(93, 211, 158, 0.4);
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .toast {
      position: fixed;
      bottom: 18px;
      right: 18px;
      background: #0b141f;
      color: #e9eefc;
      border: 1px solid var(--border);
      padding: 10px 14px;
      border-radius: 10px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      pointer-events: none;
      font-size: 14px;
    }
    .toast.visible {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div>
        <p class="eyebrow">SF Symbols</p>
        <h1>Icon Browser</h1>
        <p class="lede">Browse ${iconNames.length.toLocaleString()} icons from src/renderer/sf-symbols. Click a tile to copy its name.</p>
      </div>
      <div class="controls">
        <label class="control">
          <span>Search</span>
          <input id="search" type="search" placeholder="Filter by name..." autocomplete="off" spellcheck="false" />
        </label>
        <label class="control">
          <span>Icon size</span>
          <div class="range-row">
            <input id="size" type="range" min="32" max="144" value="72" />
            <span id="size-value">72</span>
          </div>
        </label>
      </div>
    </header>

    <p class="status" id="status"></p>
    <section class="grid" id="grid" aria-live="polite"></section>
  </main>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script>
    const ICONS = ${safeJson};
    const iconPrefix = ${JSON.stringify(iconUrlPrefix)};

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('search');
    const statusEl = document.getElementById('status');
    const sizeInput = document.getElementById('size');
    const sizeValue = document.getElementById('size-value');
    const toast = document.getElementById('toast');

    const stripExt = (value) => value.replace(/\\.svg$/i, '');
    const iconPath = (name) => {
      const encoded = encodeURIComponent(name).replace(/%2F/g, '/');
      return iconPrefix + encoded;
    };

    const createCard = (name) => {
      const button = document.createElement('button');
      button.className = 'card';
      button.type = 'button';
      button.dataset.name = name.toLowerCase();
      button.setAttribute('aria-label', 'Copy icon name ' + stripExt(name));

      button.innerHTML = [
        '<span class="pill">copy</span>',
        '<div class="preview"><img loading="lazy" src="' + iconPath(name) + '" alt="' + name + '" /></div>',
        '<div class="label">',
        '<span class="name">' + stripExt(name) + '</span>',
        '</div>',
      ].join('');

      button.addEventListener('click', async () => {
        await copyName(stripExt(name));
      });

      return button;
    };

    const cards = ICONS.map((name) => createCard(name));
    const totalIcons = cards.length;

    const renderCards = () => {
      const frag = document.createDocumentFragment();
      cards.forEach((card) => frag.appendChild(card));
      grid.replaceChildren(frag);
      updateStatus(totalIcons);
    };

    const updateStatus = (visible) => {
      statusEl.textContent = 'Showing ' + visible.toLocaleString() + ' of ' + totalIcons.toLocaleString() + ' icons';
    };

    const filterCards = (term) => {
      const value = term.trim().toLowerCase();
      let visible = 0;

      for (const card of cards) {
        const match = !value || card.dataset.name.includes(value);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
      }

      updateStatus(visible);
    };

    const copyName = async (name) => {
      try {
        await navigator.clipboard.writeText(name);
        showToast('Copied "' + name + '"');
      } catch (error) {
        console.error('Clipboard copy failed', error);
        showToast('Copy failed; check browser permissions.');
      }
    };

    let toastTimer;
    const showToast = (message) => {
      toast.textContent = message;
      toast.classList.add('visible');

      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
      }, 1600);
    };

    searchInput.addEventListener('input', (event) => {
      filterCards(event.target.value);
    });

    sizeInput.addEventListener('input', (event) => {
      const size = Number(event.target.value) || 72;
      document.documentElement.style.setProperty('--icon-size', size + 'px');
      sizeValue.textContent = String(size);
    });

    renderCards();
  </script>
</body>
</html>`
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
