import Hero from '../components/sections/Hero';
import Assemble from '../components/sections/Assemble';
import Philosophy from '../components/sections/Philosophy';
import Marquee from '../components/sections/Marquee';
import Work from '../components/sections/Work';
import Process from '../components/sections/Process';
import Expertise from '../components/sections/Expertise';
import Testimonials from '../components/sections/Testimonials';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

export default function Home() {
  useDocumentMetadata({
    title: 'Axoraa | Premium Websites, Apps, Automations & AI Integrations',
    description: 'Axoraa is a collective of senior developers building high-performance websites, custom mobile apps, workflow automations, and AI integrations to bring businesses into the digital era.',
    canonical: 'https://axoraa.tech/'
  });
  return (
    <>
      <Hero />
      <Assemble />
      <Philosophy />
      <Marquee />
      <Work />
      <Process />
      <Expertise />
      <Testimonials />
    </>
  );
}
