import type { Entitlements } from '../api/types';
import { initials } from './Icon';

export function UserCard({ user }: { user: Entitlements }) {
  return (
    <div className="user-card">
      <span className="avatar avatar--user">{initials(user.displayName)}</span>
      <span className="user-card__text">
        <span className="user-card__name">{user.displayName}</span>
        <span className="user-card__email">{user.email}</span>
      </span>
    </div>
  );
}
