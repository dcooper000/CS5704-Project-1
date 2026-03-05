/*
Created with Claude Code
Prompt: I am trying to make a webpage that allows for uploading documents.
  The necessary functionality is upload, rename, and delete.
*/

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const MANIFEST_PATH = path.join(UPLOADS_DIR, 'manifest.json');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Load or initialize manifest
function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return [];
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

let nextId = (() => {
  const m = loadManifest();
  return m.length > 0 ? Math.max(...m.map(f => f.id)) + 1 : 0;
})();

// Multer: store files with unique filenames
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static(__dirname));

// GET /files — list all files
app.get('/files', (req, res) => {
  res.json(loadManifest());
});

// POST /upload — upload one or more files
app.post('/upload', upload.array('files'), (req, res) => {
  const manifest = loadManifest();
  const added = [];
  for (const file of req.files) {
    const entry = {
      id: nextId++,
      name: file.originalname,
      size: file.size,
      storedName: file.filename
    };
    manifest.push(entry);
    added.push(entry);
  }
  saveManifest(manifest);
  res.json(added);
});

// PATCH /files/:id/rename — rename a file
app.patch('/files/:id/rename', (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });

  const manifest = loadManifest();
  const entry = manifest.find(f => f.id === id);
  if (!entry) return res.status(404).json({ error: 'File not found' });

  entry.name = name.trim();
  saveManifest(manifest);
  res.json(entry);
});

// GET /files/:id/content — serve the file by ID
app.get('/files/:id/content', (req, res) => {
  const id = parseInt(req.params.id);
  const manifest = loadManifest();
  const entry = manifest.find(f => f.id === id);
  if (!entry) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(UPLOADS_DIR, entry.storedName);
  res.sendFile(filePath);
});

// DELETE /files/:id — delete a file
app.delete('/files/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const manifest = loadManifest();
  const idx = manifest.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'File not found' });

  const [entry] = manifest.splice(idx, 1);
  const filePath = path.join(UPLOADS_DIR, entry.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  saveManifest(manifest);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/upload.html`);
});