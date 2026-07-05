import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Restaurant recommendation API running on http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/restaurants/recommend`);
});