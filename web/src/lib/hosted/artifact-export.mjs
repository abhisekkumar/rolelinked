function html(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function latex(value) {
  const replacements = { "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", "$": "\\$", "&": "\\&", "#": "\\#", "_": "\\_", "%": "\\%", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}" };
  return String(value || "").replace(/[\\{}$&#_%~^]/g, (character) => replacements[character]);
}

const blocks = (content) => (content.blocks || []).map((block) => ({ heading: block.heading || "", text: block.text || "", type: block.type || "paragraph" }));

export function renderArtifactMarkdown(artifact, version) {
  const content = version.content || {};
  const output = [`# ${content.name || artifact.title}`];
  if (content.headline) output.push(`\n**${content.headline}**`);
  if (content.contactLine) output.push(`\n${content.contactLine}`);
  if (content.recipient) output.push(`\n${content.recipient}`);
  if (content.greeting) output.push(`\n${content.greeting}`);
  for (const block of blocks(content)) output.push(`\n## ${block.heading || block.type}\n\n${block.text}`);
  if (content.closing) output.push(`\n${content.closing}`);
  return `${output.join("\n")}\n`;
}

export function renderArtifactTex(artifact, version) {
  const content = version.content || {};
  const body = blocks(content).map((block) => `\\section*{${latex(block.heading || block.type)}}\n${latex(block.text)}`).join("\n\n");
  return `\\documentclass[11pt]{article}\n\\usepackage[margin=0.75in]{geometry}\n\\begin{document}\n\\begin{center}\n{\\LARGE \\textbf{${latex(content.name || artifact.title)}}}\\\\\n${latex(content.headline || "")}\\\\\n${latex(content.contactLine || "")}\n\\end{center}\n${latex(content.recipient || "")}\n\n${latex(content.greeting || "")}\n\n${body}\n\n${latex(content.closing || "")}\n\\end{document}\n`;
}

export function renderArtifactHtml(artifact, version) {
  const content = version.content || {};
  const sections = blocks(content).map((block) => `<section><h2>${html(block.heading || block.type)}</h2><p>${html(block.text).replaceAll("\n", "<br>")}</p></section>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${html(artifact.title)}</title><style>body{max-width:760px;margin:48px auto;padding:0 32px;color:#17182f;font:16px/1.55 Arial,sans-serif}h1{margin-bottom:4px;font-size:34px}header p{margin:4px 0;color:#545978}section{margin-top:26px}h2{margin:0 0 7px;padding-bottom:4px;border-bottom:1px solid #d9dce8;font-size:17px}@media print{body{margin:0;max-width:none}}</style></head><body><header><h1>${html(content.name || artifact.title)}</h1><p>${html(content.headline || "")}</p><p>${html(content.contactLine || "")}</p></header>${content.recipient ? `<p>${html(content.recipient)}</p>` : ""}${content.greeting ? `<p>${html(content.greeting)}</p>` : ""}${sections}${content.closing ? `<p>${html(content.closing)}</p>` : ""}</body></html>`;
}
