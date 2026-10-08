import type { Entitlements } from '../api/types';
import { clearToken } from '../auth/token';
import { Icon, initials } from './Icon';

export function UserCard({ user }: { user: Entitlements }) {
  return (
    <div className="user-card">
      <span className="avatar avatar--user">{initials(user.displayName)}</span>
      <span className="user-card__text">
        <span className="user-card__name">{user.displayName}</span>
        <span className="user-card__email">{user.email}</span>
      </span>
      <button className="icon-button user-card__signout" onClick={clearToken} aria-label="Sign out" title="Sign out">
        <Icon name="signOut" />
      </button>
    </div>
  );
}
