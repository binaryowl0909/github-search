import type { GithubRepo } from "../types";

const formatCount = (value: number) => value.toLocaleString("en-US");

export function RepoCard({ repo }: { repo: GithubRepo }) {
  return (
    <article className="card">
      <div className="card__owner">
        <img
          className="card__avatar card__avatar--small"
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
        />
        <span>{repo.owner.login}</span>
      </div>
      <h3 className="card__title">
        <a href={repo.html_url} target="_blank" rel="noreferrer">
          {repo.full_name}
        </a>
      </h3>
      {repo.description && <p className="card__description">{repo.description}</p>}
      <ul className="card__stats">
        <li>⭐ {formatCount(repo.stargazers_count)}</li>
        <li>🍴 {formatCount(repo.forks_count)}</li>
        <li>🐞 {formatCount(repo.open_issues_count)}</li>
        {repo.language && <li>{repo.language}</li>}
      </ul>
    </article>
  );
}
