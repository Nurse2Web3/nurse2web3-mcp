import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const API_BASE = "https://hedgealphaoracle-production.up.railway.app";
const PORT = process.env.PORT || 8080;

async function fetchSignal(endpoint: string): Promise<string> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  const text = await res.text();
  return text;
}

function createMcpServer() {
  const mcpServer = new McpServer({
    name: "Nurse2Web3 HedgeAlphaOracle",
    version: "4.1.0",
  });

  mcpServer.tool(
    "get_sentiment",
    "Get crypto market sentiment signal. Returns bullish/bearish score 0-100.",
    { symbol: z.string().describe("Crypto or stock symbol e.g. BTC, ETH, AAPL") },
    async (args: { symbol: string }) => {
      const data = await fetchSignal(`/sentiment/${args.symbol}`);
      return { content: [{ type: "text" as const, text: data }] };
    },
  );

  mcpServer.tool(
    "get_alpha",
    "Get alpha trading signal with entry zone, price target, and stop loss.",
    { symbol: z.string().describe("Crypto or stock symbol e.g. BTC, ETH, AAPL") },
    async (args: { symbol: string }) => {
      const data = await fetchSignal(`/alpha/${args.symbol}`);
      return { content: [{ type: "text" as const, text: data }] };
    },
  );

  mcpServer.tool(
    "get_premium",
    "Get premium deep-analysis signal with full thesis and risk assessment.",
    { symbol: z.string().describe("Crypto or stock symbol e.g. BTC, ETH, NVDA") },
    async (args: { symbol: string }) => {
      const data = await fetchSignal(`/premium/${args.symbol}`);
      return { content: [{ type: "text" as const, text: data }] };
    },
  );

  mcpServer.tool(
    "get_fear_greed",
    "Get crypto Fear & Greed index with trading implications.",
    {},
    async () => {
      const data = await fetchSignal("/market/fear-greed");
      return { content: [{ type: "text" as const, text: data }] };
    },
  );

  mcpServer.tool(
    "get_whale_alert",
    "Get whale wallet movement alerts for a specific asset.",
    { symbol: z.string().describe("Crypto or stock symbol e.g. BTC, ETH") },
    async (args: { symbol: string }) => {
      const data = await fetchSignal(`/market/whale-alert/${args.symbol}`);
      return { content: [{ type: "text" as const, text: data }] };
    },
  );

  mcpServer.tool(
    "get_portfolio_risk",
    "Get portfolio risk score across multiple assets.",
    { assets: z.string().describe("Comma-separated symbols e.g. BTC,ETH,AAPL") },
    async (args: { assets: string }) => {
      const data = await fetchSignal(`/portfolio/risk-score?assets=${args.assets}`);
      return { content: [{ type: "text" as const, text: data }] };
    },
  );

  mcpServer.tool("ping", "Free health check.", {}, async () => ({
    content: [{ type: "text", text: "pong — Nurse2Web3 HedgeAlphaOracle MCP v4.1 online" }],
  }));

  return mcpServer;
}

const app = express();
const transports: Record<string, SSEServerTransport> = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  const server = createMcpServer();
  await server.connect(transport);
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
});

app.post("/messages", express.json(), async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Nurse2Web3 HedgeAlphaOracle MCP", version: "4.1.0" });
});

app.get("/", (req, res) => {
  res.json({
    name: "Nurse2Web3 HedgeAlphaOracle MCP Server",
    version: "4.1.0",
    transport: "SSE",
    endpoint: "/sse",
    tools: ["get_sentiment", "get_alpha", "get_premium", "get_fear_greed", "get_whale_alert", "get_portfolio_risk", "ping"],
    provider: "Nurse2Web3 — nurse2web3.com"
  });
});

app.listen(PORT, () => {
  console.log(`Nurse2Web3 HedgeAlphaOracle MCP server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
});
