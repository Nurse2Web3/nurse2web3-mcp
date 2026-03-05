import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = "https://hedgealphaoracle-production.up.railway.app";

async function fetchSignal(endpoint: string): Promise<string> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  const text = await res.text();
  return text;
}

async function main(): Promise<void> {
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

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch(error => {
  process.stderr.write(`Fatal error: ${error}\n`);
  process.exit(1);
});
