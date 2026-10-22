import { Link, useParams } from 'react-router';
import { useScopeNames } from '../hooks/queries';
import { Icon } from './Icon';

/** Landing page for a client: choose which product to chat about. */
export function ProductPicker() {
  const { clientId } = useParams();
  const { client } = useScopeNames(clientId);
  if (!client) return <div className="center-note">You are not entitled to this client.</div>;

  return (
    <section className="picker">
      <h1>{client.name}</h1>
      <p>Choose a product to start a conversation.</p>
      <div className="picker__grid">
        {client.products.map((p) => (
          <Link key={p.id} to={`/c/${client.id}/p/${p.id}`} className="picker__card">
            <Icon name="box" size={20} />
            <span>{p.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
