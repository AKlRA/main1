import Team from '../components/sections/Team';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

export default function TeamPage() {
  useDocumentMetadata({
    title: 'The Collective | Axoraa Senior Engineers & Developers',
    description: 'Meet the Axoraa team. We are a collective of elite senior engineers and freelance developers building high-performance digital products, web apps, and AI automations.',
    canonical: 'https://axoraa.tech/team'
  });

  return <Team />;
}
