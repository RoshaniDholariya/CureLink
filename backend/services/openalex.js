import axios from "axios";

export const fetchOpenAlex = async (query) => {
  try {
    const res = await axios.get(
      `https://api.openalex.org/works?search=${query}&per-page=50&page=1`
    );

    return res.data.results.map((item) => ({
      title: item.title,
      abstract: item.abstract || "No abstract available",
      authors: item.authorships?.map(a => a.author.display_name).join(", "),
      year: item.publication_year,
      source: "OpenAlex",
      url: item.id
    }));

  } catch (err) {
    console.error("OpenAlex error:", err.message);
    return [];
  }
};