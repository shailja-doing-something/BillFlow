import { ToolCard } from "@/components/tools/ToolCard";
import { FlaggedToolsBanner } from "@/components/tools/FlaggedToolsBanner";
import { Tool, FlaggedToolsData } from "@/types";
import { formatCurrency } from "@/lib/utils";

async function getTools(): Promise<{ tools: Tool[] }> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/tools`, { cache: "no-store" });
    if (!res.ok) return { tools: [] };
    return res.json();
  } catch {
    return { tools: [] };
  }
}

async function getFlaggedTools(): Promise<FlaggedToolsData> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/flagged-tools`, { cache: "no-store" });
    if (!res.ok) return { billedInactive: [], neverUsed: [] };
    return res.json();
  } catch {
    return { billedInactive: [], neverUsed: [] };
  }
}

function getToolFlags(
  toolName: string,
  flaggedData: FlaggedToolsData
): ("paying_not_in_use" | "never_used")[] {
  const key = toolName.toLowerCase();
  const flags: ("paying_not_in_use" | "never_used")[] = [];

  const fuzzy = (a: string, b: string) => a.includes(b) || b.includes(a);

  if (flaggedData.billedInactive.some((v) => fuzzy(key, v.vendor_name.toLowerCase()))) {
    flags.push("paying_not_in_use");
  }
  if (flaggedData.neverUsed.some((v) => fuzzy(key, v.vendor_name.toLowerCase()))) {
    flags.push("never_used");
  }
  return flags;
}

export default async function ToolsPage() {
  const [{ tools }, flaggedData] = await Promise.all([getTools(), getFlaggedTools()]);

  const llms = tools.filter((t) => t.type === "llm");
  const services = tools.filter((t) => t.type === "service");
  const totalSpend = tools.reduce((s, t) => s + t.totalSpend, 0);
  const totalFlagged =
    flaggedData.billedInactive.length + flaggedData.neverUsed.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Tools</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tools.length} vendors · {formatCurrency(totalSpend)} total spend
          </p>
        </div>
        {totalFlagged > 0 && (
          <FlaggedToolsBanner
            billedInactive={flaggedData.billedInactive}
            neverUsed={flaggedData.neverUsed}
          />
        )}
      </div>

      {llms.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            LLM Providers
          </h2>
          <div className="space-y-2">
            {llms.map((tool) => (
              <ToolCard
                key={tool.name}
                tool={tool}
                flagTypes={getToolFlags(tool.name, flaggedData)}
              />
            ))}
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Services
          </h2>
          <div className="space-y-2">
            {services.map((tool) => (
              <ToolCard
                key={tool.name}
                tool={tool}
                flagTypes={getToolFlags(tool.name, flaggedData)}
              />
            ))}
          </div>
        </section>
      )}

      {tools.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-16">
          No tools data available.
        </p>
      )}
    </div>
  );
}
