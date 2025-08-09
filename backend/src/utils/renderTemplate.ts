export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
    const v = vars[key];
    return typeof v === "string" ? v : "";
  });
}