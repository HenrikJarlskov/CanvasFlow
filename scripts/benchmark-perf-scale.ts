import http from 'http';
import WebSocket from 'ws';
import { parseDrawio } from '../src/utils/drawioParser';
import { searchSapIcons, SAP_ARCHITECTURE_ICONS } from '../src/utils/sapIcons';
import { detectShape } from '../src/utils/shapeDetection';
import { Point } from '../src/types/whiteboard';

interface LatencyStats {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  totalRequests: number;
  durationMs: number;
  reqPerSec: number;
}

function calculatePercentiles(latencies: number[]): LatencyStats {
  if (latencies.length === 0) {
    return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0, totalRequests: 0, durationMs: 0, reqPerSec: 0 };
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const avg = Number((sum / sorted.length).toFixed(2));
  const p = (pct: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * pct))];

  return {
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
    avg,
    p50: Number(p(0.5).toFixed(2)),
    p90: Number(p(0.9).toFixed(2)),
    p95: Number(p(0.95).toFixed(2)),
    p99: Number(p(0.99).toFixed(2)),
    totalRequests: sorted.length,
    durationMs: 0,
    reqPerSec: 0,
  };
}

// 1. HTTP Latency Benchmark
async function runHttpBenchmark(url: string, numRequests = 200, concurrency = 10): Promise<LatencyStats> {
  const latencies: number[] = [];
  const startTime = Date.now();
  let completed = 0;

  async function makeRequest(): Promise<number> {
    return new Promise((resolve) => {
      const t0 = performance.now();
      http.get(url, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          const t1 = performance.now();
          resolve(t1 - t0);
        });
      }).on('error', () => {
        resolve(0);
      });
    });
  }

  // Run in worker batches
  const workers: Promise<void>[] = [];
  for (let c = 0; c < concurrency; c++) {
    workers.push((async () => {
      while (completed < numRequests) {
        completed++;
        const lat = await makeRequest();
        if (lat > 0) latencies.push(lat);
      }
    })());
  }

  await Promise.all(workers);
  const durationMs = Date.now() - startTime;
  const stats = calculatePercentiles(latencies);
  stats.durationMs = durationMs;
  stats.reqPerSec = Number(((latencies.length / durationMs) * 1000).toFixed(1));
  return stats;
}

// 2. WebSocket Real-Time Broadcast & Concurrency Scalability Benchmark
async function runWebSocketScalability(
  host = 'localhost:3000',
  numClients = 50,
  messagesPerClient = 10
): Promise<{
  clientsConnected: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  avgBroadcastLatencyMs: number;
  p95BroadcastLatencyMs: number;
  maxMemoryRssMb: number;
}> {
  const sockets: WebSocket[] = [];
  const roomId = `perf_room_${Date.now()}`;
  const broadcastLatencies: number[] = [];
  let totalReceived = 0;


  const sentTimes = new Map<number, number>();

  // Connect clients
  await new Promise<void>((resolveAll) => {
    let connected = 0;
    for (let i = 0; i < numClients; i++) {
      const ws = new WebSocket(`ws://${host}/ws`);
      sockets.push(ws);

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            type: 'join_room',
            payload: {
              roomId,
              userId: `user_perf_${i}`,
              userName: `User ${i}`,
              userColor: '#3b82f6',
            },
          })
        );
        connected++;
        if (connected === numClients) resolveAll();
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'user_cursor') {
            const seq = parsed.payload?.x;
            const t0 = sentTimes.get(seq);
            if (t0 !== undefined) {
              broadcastLatencies.push(performance.now() - t0);
              totalReceived++;
            }
          }
        } catch (e) {}
      });
    }
  });

  // Warmup delay
  await new Promise((r) => setTimeout(r, 200));

  // Client 0 broadcasts cursor moves with sequence in x coordinate
  let totalSent = 0;
  const broadcaster = sockets[0];
  for (let m = 1; m <= messagesPerClient; m++) {
    sentTimes.set(m, performance.now());
    broadcaster.send(
      JSON.stringify({
        type: 'cursor_move',
        payload: {
          x: m,
          y: 200 + m * 3,
        },
      })
    );
    totalSent++;
    await new Promise((r) => setTimeout(r, 20));
  }

  // Wait for all messages to propagate
  await new Promise((r) => setTimeout(r, 600));

  // Cleanup
  sockets.forEach((ws) => ws.close());
  const memAfter = process.memoryUsage();

  const stats = calculatePercentiles(broadcastLatencies);

  return {
    clientsConnected: numClients,
    totalMessagesSent: totalSent,
    totalMessagesReceived: totalReceived,
    avgBroadcastLatencyMs: stats.avg,
    p95BroadcastLatencyMs: stats.p95,
    maxMemoryRssMb: Number((memAfter.rss / 1024 / 1024).toFixed(2)),
  };
}

// 3. Vector Shape Detection & Math Benchmark
function runGeometryBenchmark(iterations = 1000): {
  circleDetectionMs: number;
  rectangleDetectionMs: number;
  lineDetectionMs: number;
  opsPerSec: number;
} {
  // Generate sample circle points
  const circlePoints: Point[] = [];
  for (let a = 0; a < 360; a += 10) {
    const rad = (a * Math.PI) / 180;
    circlePoints.push({ x: 200 + 100 * Math.cos(rad), y: 200 + 100 * Math.sin(rad) });
  }

  // Generate sample rectangle points
  const rectPoints: Point[] = [
    { x: 50, y: 50 }, { x: 250, y: 50 }, { x: 250, y: 150 }, { x: 50, y: 150 }, { x: 50, y: 50 }
  ];

  // Generate sample line points
  const linePoints: Point[] = [
    { x: 10, y: 10 }, { x: 100, y: 100 }, { x: 200, y: 200 }
  ];

  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) {
    detectShape(circlePoints);
  }
  const t1 = performance.now();

  for (let i = 0; i < iterations; i++) {
    detectShape(rectPoints);
  }
  const t2 = performance.now();

  for (let i = 0; i < iterations; i++) {
    detectShape(linePoints);
  }
  const t3 = performance.now();

  const totalTime = t3 - t0;
  const opsPerSec = Number(((iterations * 3 / (totalTime / 1000))).toFixed(0));

  return {
    circleDetectionMs: Number((t1 - t0).toFixed(2)),
    rectangleDetectionMs: Number((t2 - t1).toFixed(2)),
    lineDetectionMs: Number((t3 - t2).toFixed(2)),
    opsPerSec,
  };
}

// 4. Draw.io Parser & SAP Icon Search Benchmark
function runParserBenchmark(iterations = 500): {
  drawioParseTimeMs: number;
  sapSearchTimeMs: number;
  sapIconsCount: number;
  drawioParseOpsSec: number;
} {
  const sampleXml = `<mxGraphModel dx="1000" dy="800" grid="1">
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="2" value="SAP Integration Suite" style="rounded=1;fillColor=#E0F2FE;strokeColor=#0284C7;strokeWidth=2;" vertex="1" parent="1">
        <mxGeometry x="100" y="80" width="140" height="70" as="geometry"/>
      </mxCell>
      <mxCell id="3" value="SAP HANA Cloud" style="shape=ellipse;fillColor=#FEF08A;strokeColor=#CA8A04;" vertex="1" parent="1">
        <mxGeometry x="300" y="80" width="80" height="80" as="geometry"/>
      </mxCell>
    </root>
  </mxGraphModel>`;

  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) {
    parseDrawio(sampleXml);
  }
  const t1 = performance.now();

  for (let i = 0; i < iterations; i++) {
    searchSapIcons('HANA', 'All');
    searchSapIcons('Integration', 'Integration');
    searchSapIcons('Cloud', 'Database & Analytics');
  }
  const t2 = performance.now();

  return {
    drawioParseTimeMs: Number((t1 - t0).toFixed(2)),
    sapSearchTimeMs: Number((t2 - t1).toFixed(2)),
    sapIconsCount: SAP_ARCHITECTURE_ICONS.length,
    drawioParseOpsSec: Number(((iterations / ((t1 - t0) / 1000))).toFixed(0)),
  };
}

// Main Runner
async function main() {
  console.log('====================================================');
  console.log('       AIdboard OKF Performance & Scalability Benchmark     ');
  console.log('====================================================\n');

  console.log('1. Benchmarking HTTP API & Web App Latency...');
  const httpStats = await runHttpBenchmark('http://localhost:3000/', 250, 15);
  console.log('HTTP Benchmark Results:', httpStats);

  console.log('\n2. Benchmarking Geometric Snapping & Math Operations...');
  const geomStats = runGeometryBenchmark(1000);
  console.log('Geometry Benchmark Results:', geomStats);

  console.log('\n3. Benchmarking Draw.io Parsing & SAP Icon Search...');
  const parseStats = runParserBenchmark(500);
  console.log('Parser Benchmark Results:', parseStats);

  console.log('\n4. Benchmarking WebSocket Concurrency & Broadcast Latency (25 clients)...');
  const wsScale25 = await runWebSocketScalability('localhost:3000', 25, 15);
  console.log('WebSocket (25 clients) Scalability Results:', wsScale25);

  console.log('\n5. Benchmarking WebSocket Concurrency & Broadcast Latency (60 clients)...');
  const wsScale60 = await runWebSocketScalability('localhost:3000', 60, 15);
  console.log('WebSocket (60 clients) Scalability Results:', wsScale60);

  const fullReport = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memoryUsageMb: {
      rss: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2)),
      heapUsed: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
    },
    http: httpStats,
    geometry: geomStats,
    parser: parseStats,
    websocket: {
      concurrency25: wsScale25,
      concurrency60: wsScale60,
    },
  };

  console.log('\n--- OKF BENCHMARK SUMMARY (JSON) ---');
  console.log(JSON.stringify(fullReport, null, 2));
}

main().catch(console.error);
