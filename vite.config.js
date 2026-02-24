import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to handle simple JSON file saving/reading
const jsonStoragePlugin = () => ({
  name: 'json-storage',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const dataPath = path.resolve('data/seasons');
      const rostersPath = path.resolve('data/rosters.json');

      // Ensure directory exists
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }

      const url = new URL(req.url, `http://${req.headers.host}`);

      if (url.pathname === '/api/rosters' && req.method === 'GET') {
        try {
          if (fs.existsSync(rostersPath)) {
            const content = fs.readFileSync(rostersPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ players: [], communityFund: 0 }));
          }
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
        return;
      }

      if (url.pathname === '/api/rosters' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            fs.writeFileSync(rostersPath, JSON.stringify(data, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
        return;
      }

      if (url.pathname === '/api/seasons' && req.method === 'GET') {
        try {
          const files = fs.readdirSync(dataPath).filter(f => f.endsWith('.json'));
          const seasons = files.map(file => {
            const content = fs.readFileSync(path.join(dataPath, file), 'utf-8');
            return JSON.parse(content);
          });
          // Sort by lastUpdated descending ideally, or id
          seasons.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(seasons));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
        return;
      }

      if (url.pathname === '/api/save-season' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (!data.id) {
              data.id = `NJSC_${Date.now()}`;
            } else if (!data.id.startsWith('NJSC_')) {
              data.id = `NJSC_${data.id}`;
            }
            data.lastUpdated = new Date().toISOString();

            const filePath = path.join(dataPath, `${data.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, id: data.id, message: 'Saved successfully' }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
        return;
      }

      if (url.pathname === '/api/delete-season' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { ids } = JSON.parse(body);
            if (!ids || !Array.isArray(ids)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'ids array required' }));
              return;
            }
            let deleted = 0;
            ids.forEach(id => {
              const filePath = path.join(dataPath, `${id}.json`);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deleted++;
              }
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, deleted }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
        return;
      }

      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsonStoragePlugin()],
})
