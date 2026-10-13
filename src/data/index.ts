import type { Project, ProcessStep, TeamMember, PricingPlan, Testimonial } from '../types';

// Full-page screenshots are resized and re-encoded at build time (originals are up to 12 MB),
// each with a 560w / 1100w srcset so phones never download the desktop size.
// (Glob patterns must be literals, hence the repetition.)
const shotSrc = import.meta.glob<string>(['../assets/{main,cafe,soft,port}*.{jpg,png}', '../assets/{zoviq-full,doc,pet,polymind,children,aarogyam,spa,zumba}.png'], { query: '?w=1100&quality=72&format=webp', import: 'default', eager: true });
const shotSet = import.meta.glob<string>(['../assets/{main,cafe,soft,port}*.{jpg,png}', '../assets/{zoviq-full,doc,pet,polymind,children,aarogyam,spa,zumba}.png'], { query: '?w=560;1100&quality=72&format=webp&as=srcset', import: 'default', eager: true });
const shot = (file: string) => ({ image: shotSrc[`../assets/${file}`], srcSet: shotSet[`../assets/${file}`] });

// Case study before / after
import zoviq from '../assets/zoviq.png?w=1200&quality=80&format=webp';
import zoviqold from '../assets/zoviqold.png?w=1200&quality=80&format=webp';

// Team portraits
import akshar from '../assets/akshar.jpeg?w=640&quality=78&format=webp';
import abhinav from '../assets/abhinav.jpeg?w=640&quality=78&format=webp';
import adnaan from '../assets/adnaan.jpeg?w=640&quality=78&format=webp';
import bhuvan from '../assets/bhuvan.jpeg?w=640&quality=78&format=webp';

export const projects: Project[] = [
  // Company Portfolios
  {
    id: 1,
    title: 'Zoviq',
    category: 'Company Portfolio',
    ...shot('zoviq-full.png'),
    link: 'https://www.zoviq.page/',
    tags: ['React', 'Vite', 'TailwindCSS']
  },
  {
    id: 2,
    title: 'ShineGoGlobal',
    category: 'Company Portfolio',
    ...shot('main4.jpg'),
    link: 'https://shinegoglobal.com/',
    tags: ['TypeScript', 'Node.js', 'PostgreSQL']
  },

  {
    id: 3,
    title: 'Polymind',
    category: 'Company Portfolio',
    ...shot('polymind.png'),
    link: 'https://polymind.zoviq.page/',
    tags: ['React', 'Vite', 'TailwindCSS']
  },
  {
    id: 4,
    title: 'DevStudio',
    category: 'Company Portfolio',
    ...shot('main2.jpg'),
    link: 'https://devstudio.axoraa.tech/',
    tags: ['Next.js', 'TailwindCSS', 'Framer Motion']
  },
  {
    id: 5,
    title: 'DevCollective',
    category: 'Company Portfolio',
    ...shot('main3.jpg'),
    link: 'https://devcollective.axoraa.tech/',
    tags: ['React', 'Vite', 'GSAP']
  },
  

  // Medical Systems
  {
    id: 6,
    title: 'Aarogyam',
    category: 'Medical System',
    ...shot('aarogyam.png'),
    link: 'https://aarogyam.axoraa.tech/',
    tags: ['Next.js', 'React', 'TailwindCSS']
  },
  {
    id: 7,
    title: 'Doc CRM',
    category: 'Medical System',
    ...shot('doc.png'),
    link: 'https://doc.axoraa.tech/',
    tags: ['React', 'Node.js', 'PostgreSQL']
  },

  // Cafe Websites
  {
    id: 8,
    title: 'SABLE',
    category: 'Cafe Website',
    ...shot('cafe1.jpg'),
    link: 'https://sable.axoraa.tech/',
    tags: ['Next.js', 'MongoDB', 'Vercel']
  },
  {
    id: 9,
    title: 'TERRA',
    category: 'Cafe Website',
    ...shot('cafe2.jpg'),
    link: 'https://terra.axoraa.tech/',
    tags: ['React', 'Redux', 'AntD']
  },
  {
    id: 10,
    title: 'LUMINA',
    category: 'Cafe Website',
    ...shot('cafe3.jpg'),
    link: 'https://lumina.axoraa.tech/',
    tags: ['Vue.js', 'TailwindCSS', 'Firebase']
  },
  {
    id: 11,
    title: 'Ojas Theta',
    category: 'Cafe Website',
    ...shot('cafe4.jpg'),
    link: 'https://ojas-theta.vercel.app/',
    tags: ['Svelte', 'Node.js', 'MySQL']
  },
  {
    id: 12,
    title: 'Masala Modern',
    category: 'Cafe Website',
    ...shot('cafe5.jpg'),
    link: 'https://masala-modern.vercel.app/',
    tags: ['Next.js', 'Prisma', 'PostgreSQL']
  },
  {
    id: 13,
    title: 'Lumière',
    category: 'Cafe Website',
    ...shot('cafe6.jpg'),
    link: 'https://new-folder-two-steel.vercel.app/',
    tags: ['React', 'Framer Motion', 'Vite']
  },

  // Internal Softwares
  {
    id: 14,
    title: 'F-Mine',
    category: 'Internal Software',
    ...shot('soft1.png'),
    link: 'https://restaurant-crm.axoraa.tech/',
    tags: ['React', 'TypeScript', 'Dashboard']
  },
  {
    id: 15,
    title: 'AI Test Propter',
    category: 'Internal Software',
    ...shot('soft2.png'),
    link: 'https://ai-test-propter.vercel.app',
    tags: ['Python', 'FastAPI', 'React']
  },
  {
    id: 16,
    title: 'Sparkonomy',
    category: 'Internal Software',
    ...shot('soft3.png'),
    link: 'https://sparkonomy.axoraa.tech/',
    tags: ['Next.js', 'Redis', 'TailwindCSS']
  },
  {
    id: 17,
    title: 'Flam Five',
    category: 'Internal Software',
    ...shot('soft4.png'),
    link: 'https://flam.axoraa.tech/',
    tags: ['Angular', 'RxJS', 'Node.js']
  },
  {
    id: 18,
    title: 'Smart Home Dash',
    category: 'Internal Software',
    ...shot('soft5.png'),
    link: 'https://aksharkh.github.io/Smart-home-dashboard-/',
    tags: ['IoT', 'React', 'MQTT']
  },

  // Creative Portals
  {
    id: 19,
    title: 'PetCare Portal',
    category: 'Creative Portals',
    ...shot('pet.png'),
    link: 'https://pet.axoraa.tech/',
    tags: ['React', 'Vite', 'TailwindCSS']
  },
  {
    id: 20,
    title: 'Zumba Studio',
    category: 'Creative Portals',
    ...shot('zumba.png'),
    link: 'https://zumba.axoraa.tech/',
    tags: ['React', 'GSAP', 'TailwindCSS']
  },
  {
    id: 21,
    title: 'KinderCare Portal',
    category: 'Creative Portals',
    ...shot('children.png'),
    link: 'https://kinder.axoraa.tech/',
    tags: ['Next.js', 'Framer Motion', 'TailwindCSS']
  },
  {
    id: 22,
    title: 'Aura Spa Portal',
    category: 'Creative Portals',
    ...shot('spa.png'),
    link: 'https://spa.axoraa.tech/',
    tags: ['React', 'TailwindCSS', 'Vercel']
  },
  

  // Personal Portfolios
  {
    id: 23,
    title: 'Bhuvan',
    category: 'Personal Portfolio',
    ...shot('port1.jpg'),
    link: 'https://bhuvanmh.pages.dev/',
    tags: ['HTML', 'CSS', 'JavaScript']
  },
  {
    id: 24,
    title: 'Abhinav R',
    category: 'Personal Portfolio',
    ...shot('port2.jpg'),
    link: 'https://my-portfoilo-ashy.vercel.app/',
    tags: ['React', 'Three.js', 'Vercel']
  },
  {
    id: 25,
    title: 'Akshar',
    category: 'Personal Portfolio',
    ...shot('port3.png'),
    link: 'https://akshar.axoraa.tech/',
    tags: ['Next.js', 'Sanity', 'TailwindCSS']
  }
];

export const processSteps: ProcessStep[] = [
  {
    id: '01',
    title: 'Discovery & Strategy',
    desc: 'We start by deeply understanding your business goals, target audience, and technical constraints. We define the architecture and set a roadmap for success.'
  },
  {
    id: '02',
    title: 'Design & Prototyping',
    desc: 'Our design philosophy merges aesthetics with usability. We create wireframes, interactive prototypes, and a visual language that captivates your users.'
  },
  {
    id: '03',
    title: 'Precision Engineering',
    desc: 'This is where the magic happens. We write clean, modular, and scalable code using React, Node.js, and modern cloud infrastructure.'
  },
  {
    id: '04',
    title: 'Launch & Scale',
    desc: 'Zero-downtime deployment. We ensure your application is secure, incredibly fast, SEO-optimized, and ready to handle massive amounts of traffic.'
  }
];

export const team: TeamMember[] = [
  { id: 1, name: 'Akshar', role: 'Lead Software Developer', github: 'https://github.com/aksharkh', linkedin: 'https://www.linkedin.com/in/akshar-k-h-1b404521b/', image: akshar },
  { id: 2, name: 'Abhinav', role: 'Software Engineer', github: 'https://github.com/abhinavrbharadwaj7', linkedin: 'https://www.linkedin.com/in/abhinavrbharadwaj/', image: abhinav },
  { id: 3, name: 'Adnaan', role: 'FullStack Developer', github: 'https://github.com/Khan012003', linkedin: 'https://www.linkedin.com/in/adnaan-khan-153042319/', image: adnaan },
  { id: 4, name: 'Bhuvan', role: 'Java FullStack Developer', github: 'https://github.com/AKlRA', linkedin: 'https://www.linkedin.com/in/bhuvan-mh-0144492a8/', image: bhuvan },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'landing',
    name: 'Basic Landing Pages',
    price: '₹20,000 - ₹25,000',
    originalPrice: '₹30,000',
    description: "Equivalent to 1 month's salary of entry-level staff. A one-time investment for a 24/7 lead-generation engine with lifetime returns.",
    features: ['Custom UI/UX Design', 'Mobile Responsive', 'SEO Optimization', 'Contact Form Integration', 'Fast Load Times', '3 Years Free Maintenance']
  },
  {
    id: 'custom',
    name: 'Full Custom Websites',
    price: '₹45,000 - ₹50,000',
    originalPrice: '₹60,000',
    description: "Equivalent to 1 month's salary of mid-level staff. An Awwwards-grade visual machine built for lifetime brand dominance.",
    features: ['Custom Awwwards-Level Design', 'CMS Integration', 'Advanced Animations (GSAP)', 'Premium Aesthetics', 'E-commerce Ready', '3 Years Free Maintenance'],
    recommended: true
  },
  {
    id: 'software',
    name: 'Internal Software & CRMs',
    price: 'Custom',
    description: "Equivalent to 1 month's salary of senior/management staff. Custom operations engines to automate your entire team's workflow forever.",
    features: ['Custom Workflow Automation', 'Secure Data Architecture', 'Role-based Access Control', 'Third-party API Integration', 'Scalable Cloud Infrastructure', '3 Years Free Maintenance']
  }
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    clientName: 'Abhinav',
    clientRole: 'Founder',
    companyName: 'Zoviq',
    content: "Our previous website was a basic, old, boxy interface that didn't reflect our innovative AI products. The team transformed our digital presence into a highly modern, attractive platform. The new aesthetic perfectly positions our AI agents and extensions to top-tier users, yielding a massive boost in engagement.",
    growthStats: [
      { label: 'User Engagement', value: '+300%' },
      { label: 'Bounce Rate', value: '-65%' },
      { label: 'Brand Perception', value: '10x' }
    ],
    beforeImage: zoviqold,
    afterImage: zoviq
  }
];
