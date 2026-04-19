export default function ResultCard({ data }) {
  const hasLongAbstract = data.abstract && data.abstract.length > 280;
  const abstractText = hasLongAbstract
    ? `${data.abstract.slice(0, 280)}...`
    : data.abstract;

  return (
    <article className="result-card">
      <div className="result-top">
        <h3 className="result-title">{data.title || "Untitled"}</h3>
        <span className="result-source">{data.source || "Source"}</span>
      </div>

      {abstractText && <p className="result-abstract">{abstractText}</p>}
      {data.year && <p className="result-meta">Year: {data.year}</p>}
      {data.status && <p className="result-meta">Status: {data.status}</p>}
      {data.location && <p className="result-meta">Location: {data.location}</p>}

      {data.url && (
        <a href={data.url} target="_blank" rel="noreferrer" className="result-link">
          View Source
        </a>
      )}
    </article>
  );
}
