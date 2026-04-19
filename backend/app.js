import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { fetchOpenAlex } from "./services/openalex.js";
import { fetchPubMed } from "./services/pubmed.js";
import { fetchClinicalTrials } from "./services/clinical.js";
import { rankResults } from "./utils/ranker.js";
import { generateLLMResponse } from "./services/llm.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/research", async (req, res) => {
  try {
    const { disease, query, location } = req.body;

    if (!disease || !query || !location) {
      return res.status(400).json({
        success: false,
        error: "Please provide disease, query, and location."
      });
    }

    const expandedQuery = `${query} ${disease} ${location} treatment clinical research`;
    console.log("Expanded Query:", expandedQuery);

    const [openalexData, pubmedData, clinicalData] = await Promise.all([
      fetchOpenAlex(expandedQuery),
      fetchPubMed(expandedQuery),
      fetchClinicalTrials(disease, location)
    ]);

    const publications = rankResults(
      [...openalexData, ...pubmedData],
      disease,
      query
    );

    const trials = rankResults(clinicalData, disease, query);

    const topPublications = publications.slice(0, 5);
    const topTrials = trials.slice(0, 3);

    const finalResponse = await generateLLMResponse({
      disease,
      query,
      location,
      publications: topPublications,
      trials: topTrials
    });

    res.json({
      success: true,
      data: {
        publications: topPublications,
        trials: topTrials,
        answer: finalResponse
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
