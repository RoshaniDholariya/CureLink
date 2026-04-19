export const rankResults = (items, disease, query) => {
  return items
    .map((item) => {
      let score = 0;

      const text = (item.title + " " + item.abstract).toLowerCase();

      if (text.includes(disease.toLowerCase())) score += 5;
      if (text.includes(query.toLowerCase())) score += 5;

      if (item.year && item.year >= 2020) score += 3;

      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score);
};