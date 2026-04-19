import axios from "axios";
import xml2js from "xml2js";

export const fetchPubMed = async (query) => {
  try {
   
    const searchRes = await axios.get(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&retmax=50&retmode=json`
    );

    const ids = searchRes.data?.esearchresult?.idlist;

    if (!ids || ids.length === 0) return [];

    // Step 2: Fetch Details
    const fetchRes = await axios.get(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(",")}&retmode=xml`
    );

    const parsed = await xml2js.parseStringPromise(fetchRes.data);

    const articles =
      parsed?.PubmedArticleSet?.PubmedArticle || [];

    return articles.map((item) => {
      const article = item?.MedlineCitation?.[0]?.Article?.[0];

      return {
        title: article?.ArticleTitle?.[0] || "No title",
        abstract:
          article?.Abstract?.[0]?.AbstractText?.[0] || "No abstract",
        authors: "Various",
        year:
          article?.Journal?.[0]?.JournalIssue?.[0]?.PubDate?.[0]?.Year?.[0] ||
          "N/A",
        source: "PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/"
      };
    });

  } catch (err) {
    console.error("PubMed error:", err.message);
    return [];
  }
};