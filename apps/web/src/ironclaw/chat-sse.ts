export type ParsedSseEvent = { event: string; data: string };

export function appendSseBuffer(buffer: string, chunk: string): { rest: string; events: ParsedSseEvent[] } {
  const combined = buffer + chunk;
  const parts = combined.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? "";
  const events: ParsedSseEvent[] = [];

  for (const block of parts) {
    if (!block.trim()) continue;
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (dataLines.length > 0) {
      events.push({ event: eventName, data: dataLines.join("\n") });
    }
  }

  return { rest, events };
}
