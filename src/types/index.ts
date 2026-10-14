export interface Project {
  id: number;
  title: string;
  category: string;
  image: string;
  srcSet: string;
  /** The screenshot is one screen tall, so it never goes in a portrait frame. */
  landscape: boolean;
  link: string;
  tags: string[];
}

export interface ProcessStep {
  id: string;
  title: string;
  desc: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  github: string;
  linkedin: string;
  image: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientRole: string;
  companyName: string;
  content: string;
  growthStats: { label: string; value: string }[];
  beforeImage?: string;
  afterImage?: string;
}
