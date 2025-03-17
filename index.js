const express = require("express");
const cors = require("cors");
const dns = require("dns");
const app = express();

// Middleware
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: true })); // Body parser pour POST
app.use(express.json()); // Pour JSON dans les requêtes POST (optionnel)

// Stockage en mémoire (tableau d’URLs)
const urlDatabase = [];
let idCounter = 1;

// Route racine (optionnelle)
app.get("/", (req, res) => {
  res.send(`
    <h1>URL Shortener Microservice</h1>
    <form method="POST" action="/api/shorturl">
      <input type="text" name="url" placeholder="https://example.com" />
      <button type="submit">Shorten</button>
    </form>
  `);
});

// POST /api/shorturl
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Vérifier si l’URL commence par http:// ou https://
  if (!/^https?:\/\//i.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // Extraire le hostname (ex. : "www.example.com" de "https://www.example.com/path")
  const urlObj = new URL(originalUrl);
  const hostname = urlObj.hostname;

  // Valider le domaine avec dns.lookup
  dns.lookup(hostname, (err) => {
    if (err) {
      console.log("DNS error:", err);
      return res.json({ error: "invalid url" });
    }

    // Vérifier si l’URL existe déjà
    const existing = urlDatabase.find(
      (entry) => entry.original_url === originalUrl
    );
    if (existing) {
      return res.json(existing);
    }

    // Ajouter une nouvelle entrée
    const shortUrl = idCounter++;
    const urlEntry = { original_url: originalUrl, short_url: shortUrl };
    urlDatabase.push(urlEntry);

    console.log("Database:", urlDatabase);
    res.json(urlEntry);
  });
});

// GET /api/shorturl/:id
app.get("/api/shorturl/:id", (req, res) => {
  const shortUrl = parseInt(req.params.id, 10);
  const urlEntry = urlDatabase.find((entry) => entry.short_url === shortUrl);

  if (!urlEntry) {
    return res.json({ error: "No short URL found for given input" });
  }

  res.redirect(urlEntry.original_url);
});

// Lancer le serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
