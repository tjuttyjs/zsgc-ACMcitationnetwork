// frontend/src/utils/neo4jUtils.js
export const neo4jIntToNumber = (neo4jInt) => {
  if (neo4jInt && typeof neo4jInt === 'object' && 'low' in neo4jInt) {
    return neo4jInt.low;
  }
  return neo4jInt;
};

export const processPaperData = (paper) => {
  return {
    ...paper,
    year: neo4jIntToNumber(paper.year),
    n_citation: neo4jIntToNumber(paper.n_citation)
  };
};

export const processStatisticsData = (stats) => {
  return {
    papers: neo4jIntToNumber(stats.papers),
    authors: neo4jIntToNumber(stats.authors),
    venues: neo4jIntToNumber(stats.venues),
    citations: neo4jIntToNumber(stats.citations)
  };
};