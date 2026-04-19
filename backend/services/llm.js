import axios from "axios";

const DEFAULT_HF_MODEL_ID = "facebook/bart-large-cnn";
const FALLBACK_MODEL_IDS = ["sshleifer/distilbart-cnn-12-6"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatStructuredResponse = ({
  disease,
  query,
  location,
  llmText,
  publications,
  trials
}) => {
  const overview = (llmText || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 450) || "No overview generated.";

  const pubLines =
    publications.length > 0
      ? publications
          .slice(0, 5)
          .map((p, i) => `- ${i + 1}. ${p.title} (${p.year || "N/A"})`)
          .join("\n")
      : "- No publication records found.";

  const trialLines =
    trials.length > 0
      ? trials
          .slice(0, 3)
          .map((t, i) => `- ${i + 1}. ${t.title} [${t.status || "Unknown status"}]`)
          .join("\n")
      : "- No trial records found.";

  return `1. Overview
${overview}

2. Research Insights
Disease: ${disease}
Query: ${query}
Location: ${location}
${pubLines}

3. Clinical Trials
${trialLines}

4. Conclusion
Current evidence highlights relevant publications and active trials for your selected focus and location.

5. Sources
- OpenAlex
- PubMed
- ClinicalTrials.gov`;
};

const summarizeWithFallback = ({
  disease,
  query,
  location,
  publications,
  trials,
  reason
}) => {
  const topPubs = publications.slice(0, 3);
  const topTrials = trials.slice(0, 3);

  const pubLines =
    topPubs.length > 0
      ? topPubs.map((p, i) => `${i + 1}. ${p.title} (${p.year || "N/A"})`).join("\n")
      : "No publication records found for this query.";

  const trialLines =
    topTrials.length > 0
      ? topTrials
          .map((t, i) => `${i + 1}. ${t.title} [${t.status || "Unknown status"}]`)
          .join("\n")
      : "No trial records found for this disease.";

  return `Overview:
For "${query}" in ${disease} focused on ${location}, here is a data-grounded summary from fetched sources.

Research Insights:
${pubLines}

Clinical Trials:
${trialLines}

Conclusion:
The response was generated from available dataset results because the LLM service was temporarily unavailable.

Sources:
- OpenAlex
- PubMed
- ClinicalTrials.gov

Debug:
${reason}`;
};

const extractGeneratedText = (data) => {
  if (!data) return "";

  if (typeof data === "string") return data.trim();
  if (Array.isArray(data)) {
    const first = data[0];
    if (!first) return "";
    if (typeof first === "string") return first.trim();
    if (typeof first.generated_text === "string") return first.generated_text.trim();
    if (typeof first.summary_text === "string") return first.summary_text.trim();
    if (Array.isArray(first.generated_text)) return first.generated_text.join("\n").trim();
  }

  if (typeof data === "object") {
    if (typeof data.generated_text === "string") return data.generated_text.trim();
    if (typeof data.summary_text === "string") return data.summary_text.trim();
    if (Array.isArray(data.generated_text)) return data.generated_text.join("\n").trim();
  }

  return "";
};

export const generateLLMResponse = async ({
  disease,
  query,
  location = "the requested location",
  publications,
  trials
}) => {
  try {
    const hfToken = process.env.HF_TOKEN;
    const preferredModelId = process.env.HF_MODEL_ID || DEFAULT_HF_MODEL_ID;
    const modelCandidates = [preferredModelId, ...FALLBACK_MODEL_IDS].filter(
      (id, index, arr) => id && arr.indexOf(id) === index
    );
    const prompt = `
You are a medical research assistant.

Disease: ${disease}
Query: ${query}
Location: ${location}

Publications:
${publications.map(p => `- ${p.title} (${p.year})`).join("\n")}

Clinical Trials:
${trials.map(t => `- ${t.title} (${t.status})`).join("\n")}

STRICT:
- Use only given data
- No hallucination

Give:
1. Overview
2. Research Insights
3. Clinical Trials
4. Conclusion
5. Sources
`;

    if (!hfToken) {
      return summarizeWithFallback({
        disease,
        query,
        location,
        publications,
        trials,
        reason: "Missing HF_TOKEN in backend/.env"
      });
    }

    let lastError = "Unknown LLM error";

    for (const modelId of modelCandidates) {
      const endpointCandidates = process.env.HF_MODEL_URL
        ? [process.env.HF_MODEL_URL]
        : [`https://router.huggingface.co/hf-inference/models/${modelId}`];

      for (let attempt = 1; attempt <= 2; attempt++) {
        for (const endpoint of endpointCandidates) {
          const response = await axios({
            method: "POST",
            url: endpoint,
            headers: {
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/json"
            },
            data: {
              inputs: prompt,
              options: {
                wait_for_model: true
              }
            },
            timeout: 45000,
            validateStatus: () => true
          });

          if (response.status >= 200 && response.status < 300) {
            const generated = extractGeneratedText(response.data);
            if (generated) {
              return formatStructuredResponse({
                disease,
                query,
                location,
                llmText: generated,
                publications,
                trials
              });
            }
            lastError = "HF returned success status but no generated text";
            continue;
          }

          const message =
            response.data?.error ||
            response.data?.message ||
            `HF HTTP ${response.status}`;
          lastError = String(message);

          // Try next endpoint/model if this one is unavailable.
          if (response.status === 404 || response.status === 400) {
            continue;
          }

          if (response.status === 503 && attempt < 2) {
            await wait(2500);
            continue;
          }

          // Non-retryable status for this endpoint.
          break;
        }
      }
    }

    return summarizeWithFallback({
      disease,
      query,
      location,
      publications,
      trials,
      reason: lastError
    });

  } catch (err) {
    const reason = err.response?.data?.error || err.response?.data || err.message;
    console.error("HF FULL ERROR:", reason);
    return summarizeWithFallback({
      disease,
      query,
      location,
      publications,
      trials,
      reason: String(reason)
    });
  }
};
