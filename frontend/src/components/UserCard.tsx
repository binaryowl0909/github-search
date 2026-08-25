import type { GithubUser } from "../types";

export function UserCard({ user }: { user: GithubUser }) {
  return (
    <article className="card">
      <img className="card__avatar" src={user.avatar_url} alt={user.login} />
      <h3 className="card__title">{user.login}</h3>
      <p className="card__meta">{user.type}</p>
      <a
        className="card__link"
        href={user.html_url}
        target="_blank"
        rel="noreferrer"
      >
        View profile
      </a>
    </article>
  );
}
