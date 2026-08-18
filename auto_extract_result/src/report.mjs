export function extractCaseNumbers(labels) {
  return [...new Set(
    labels
      .map((label) => label.trim().match(/^Test Case (\d+)$/)?.[1])
      .filter(Boolean)
      .map(Number),
  )].sort((first, second) => first - second);
}

export function casePassed(text) {
  return /^Result:\s+PASS\b/m.test(text);
}

export function reportTimestamp(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ];
  return `${parts.slice(0, 3).join("-")}-${parts.slice(3).join("")}`;
}

export function buildReport({ createdAt, questionUrl, sourceName, cases }) {
  const passedCases = cases.filter(({ text }) => casePassed(text)).length;
  const allPassed = cases.length > 0 && passedCases === cases.length;
  const lines = [
    "# HackerRank Run Results",
    "",
    `- Date: ${createdAt.toISOString()}`,
    `- Question: ${questionUrl}`,
    `- Source: \`${sourceName}\``,
    `- Overall: ${allPassed ? "All available test cases passed" : "One or more test cases failed"}`,
    `- Passed: ${passedCases}/${cases.length}`,
    "",
  ];

  for (const { number, text } of cases) {
    lines.push(`## Test Case ${number}`, "", "~~~~text", text.trimEnd(), "~~~~", "");
  }

  return `${lines.join("\n")}\n`;
}

