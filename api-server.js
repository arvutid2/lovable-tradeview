import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false
}));
app.use(express.json());

const PORT = process.env.API_PORT || 8000;

// Global state
let botProcess = null;
let botStartTime = null;

// API Endpoints

// Bot status
app.get('/api/bot/status', (req, res) => {
  res.json({
    running: botProcess !== null,
    started_at: botStartTime ? botStartTime.toISOString() : null,
    uptime: botProcess ? Math.floor((Date.now() - (botStartTime ? botStartTime.getTime() : 0)) / 1000) : 0,
    pid: botProcess ? botProcess.pid : null,
  });
});

// Start bot
app.post('/api/bot/start', (req, res) => {
  if (botProcess) {
    return res.json({ error: 'Bot on juba käivitatud', running: true });
  }

  try {
    botProcess = spawn('python', ['bot.py'], {
      cwd: path.join(__dirname, '../bot'),
      stdio: 'inherit',
    });

    botStartTime = new Date();

    botProcess.on('exit', () => {
      botProcess = null;
      botStartTime = null;
    });

    botProcess.on('error', (error) => {
      console.error('Bot käivitamise viga:', error);
      botProcess = null;
      botStartTime = null;
    });

    res.json({ running: true, started_at: botStartTime, message: 'Bot käivitatud' });
  } catch (error) {
    console.error('Bot käivitamise viga:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop bot
app.post('/api/bot/stop', (req, res) => {
  if (!botProcess) {
    return res.json({ error: 'Bot pole käivitatud', running: false });
  }

  try {
    botProcess.kill();
    botProcess = null;
    botStartTime = null;
    res.json({ running: false, message: 'Bot peatatud' });
  } catch (error) {
    console.error('Bot peatamise viga:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run backtest
app.post('/api/bot/backtest', (req, res) => {
  exec('python backtester.py', { cwd: path.join(__dirname, '../bot') }, (error, stdout, stderr) => {
    if (error) {
      console.error('Backtest viga:', error);
      return res.status(500).json({ error: error.message, output: stderr });
    }

    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch {
      res.json({ output: stdout });
    }
  });
});

// Train model
app.post('/api/bot/brain/train', (req, res) => {
  exec('python brain.py', { cwd: path.join(__dirname, '../bot'), timeout: 300000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Model training viga:', error);
      return res.status(500).json({ error: error.message, output: stderr });
    }

    res.json({ trained: true, output: stdout });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('📡 Health check received');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🤖 Trading Bot API Server             ║
║   Running on http://127.0.0.1:${PORT}    ║
║   Subprocess Manager (No Flask!)         ║
╚══════════════════════════════════════════╝
  `);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('📴 Server shutting down...');
  if (botProcess) {
    botProcess.kill();
  }
  process.exit(0);
});
