const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { WebSocketServer } = require('ws');
const http = require('http');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const AGENT_KEYWORDS = [
  'python', 'node', 'java', 'ruby', 'go', 'rust',
  'opencode', 'claude', 'gpt', 'llm', 'agent',
  'langchain', 'autogen', 'crewai', 'llamaindex',
  'ollama', 'vllm', 'litellm', 'fastapi', 'uvicorn',
  'celery', 'worker', 'scheduler', 'cron',
  'npm', 'npx', 'tsx', 'ts-node', 'deno', 'bun'
];

const AGENT_CLASSIFICATIONS = [
  { keywords: ['python', 'pip'], type: 'Python Agent', color: '#3b82f6' },
  { keywords: ['node', 'npm', 'npx', 'tsx', 'ts-node'], type: 'Node Agent', color: '#22c55e' },
  { keywords: ['opencode', 'claude', 'gpt'], type: 'AI Agent', color: '#a855f7' },
  { keywords: ['ollama', 'vllm', 'llm'], type: 'LLM Server', color: '#f59e0b' },
  { keywords: ['worker', 'celery', 'queue'], type: 'Worker', color: '#ef4444' },
  { keywords: ['java', 'jar'], type: 'JVM Agent', color: '#f97316' },
  { keywords: ['go', 'rust', 'deno', 'bun'], type: 'System Agent', color: '#06b6d4' },
];

function classifyAgent(name, cmd) {
  const lower = (name + ' ' + cmd).toLowerCase();
  const match = AGENT_CLASSIFICATIONS.find(c => c.keywords.some(kw => lower.includes(kw)));
  return match || { type: 'Process', color: '#6b7280' };
}

function resolveProcessStatus(stat) {
  if (stat.startsWith('R')) return 'running';
  if (stat.startsWith('S')) return 'sleeping';
  if (stat.startsWith('Z')) return 'zombie';
  return 'other';
}

function getProcesses() {
  return new Promise((resolve, reject) => {
    exec('ps aux --sort=-%cpu | head -80', (err, stdout) => {
      if (err) return reject(err);

      const processes = stdout
        .trim()
        .split('\n')
        .slice(1)
        .map(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 11) return null;

          const [user, rawPid, rawCpu, rawMem, rawVsz, rawRss, , stat, start, time, ...cmdParts] = parts;
          const cmd = cmdParts.join(' ');
          const name = cmd.split('/').pop().split(' ')[0];
          const lowerCmd = cmd.toLowerCase();
          const lowerName = name.toLowerCase();

          const isAgentProcess = AGENT_KEYWORDS.some(kw => lowerCmd.includes(kw) || lowerName.includes(kw));
          if (!isAgentProcess) return null;

          const { type, color } = classifyAgent(name, cmd);

          return {
            pid: parseInt(rawPid),
            name,
            cmd: cmd.length > 80 ? cmd.slice(0, 80) + '...' : cmd,
            user,
            cpu: parseFloat(rawCpu),
            mem: parseFloat(rawMem),
            rss: Math.round(parseInt(rawRss) / 1024),
            vsz: Math.round(parseInt(rawVsz) / 1024),
            stat,
            start,
            time,
            type,
            color,
            status: resolveProcessStatus(stat)
          };
        })
        .filter(Boolean);

      resolve(processes);
    });
  });
}

function getSystemInfo() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const { totalTick, totalIdle } = cpus.reduce(
    (acc, cpu) => {
      for (const type in cpu.times) acc.totalTick += cpu.times[type];
      acc.totalIdle += cpu.times.idle;
      return acc;
    },
    { totalTick: 0, totalIdle: 0 }
  );

  const toGB = (bytes) => Math.round(bytes / 1024 / 1024 / 1024 * 10) / 10;

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptime: Math.round(os.uptime()),
    cpuModel: cpus[0]?.model || 'Unknown',
    cpuCores: cpus.length,
    cpuUsage: Math.round((1 - totalIdle / totalTick) * 100),
    totalMem: toGB(totalMem),
    usedMem: toGB(usedMem),
    freeMem: toGB(freeMem),
    memUsagePercent: Math.round(usedMem / totalMem * 100),
    loadAvg: os.loadavg().map(v => Math.round(v * 100) / 100)
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/system', (_req, res) => {
  res.json(getSystemInfo());
});

app.get('/api/processes', async (_req, res) => {
  try {
    const procs = await getProcesses();
    res.json({ processes: procs, total: procs.length, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/snapshot', async (_req, res) => {
  try {
    const [procs, sys] = await Promise.all([getProcesses(), Promise.resolve(getSystemInfo())]);
    res.json({ processes: procs, system: sys, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const MAX_HISTORY_POINTS = 60;
const history = { cpu: [], mem: [] };

async function broadcastUpdate() {
  if (wss.clients.size === 0) return;
  try {
    const [procs, sys] = await Promise.all([getProcesses(), Promise.resolve(getSystemInfo())]);

    history.cpu.push(sys.cpuUsage);
    history.mem.push(sys.memUsagePercent);
    if (history.cpu.length > MAX_HISTORY_POINTS) history.cpu.shift();
    if (history.mem.length > MAX_HISTORY_POINTS) history.mem.shift();

    const payload = JSON.stringify({
      type: 'update',
      processes: procs,
      system: sys,
      history,
      timestamp: new Date().toISOString()
    });

    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(payload);
    }
  } catch (e) {
    console.error('broadcast error:', e.message);
  }
}

setInterval(broadcastUpdate, 3000);

wss.on('connection', async (ws) => {
  console.log('WebSocket client connected');
  try {
    const [procs, sys] = await Promise.all([getProcesses(), Promise.resolve(getSystemInfo())]);
    ws.send(JSON.stringify({ type: 'update', processes: procs, system: sys, history, timestamp: new Date().toISOString() }));
  } catch (_e) {}
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Agent Monitor API running on http://localhost:${PORT}`);
  console.log(`WebSocket server on ws://localhost:${PORT}`);
});
