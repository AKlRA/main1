import Pricing from '../components/sections/Pricing';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

export default function PricingPage() {
  useDocumentMetadata({
    title: 'Investment Plans & Pricing | Axoraa Software Engineering',
    description: 'Explore custom pricing plans for websites, custom application development, workflow automation, and specialized AI integrations engineered by Axoraa.',
    canonical: 'https://axoraa.tech/pricing'
  });

  return <Pricing />;
}
