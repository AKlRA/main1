import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useGSAP } from '@gsap/react';
import { EASE } from './tokens';

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText, DrawSVGPlugin, useGSAP);

CustomEase.create('ax.out', EASE.out.join(','));
CustomEase.create('ax.inOut', EASE.inOut.join(','));
CustomEase.create('ax.drawer', EASE.drawer.join(','));

gsap.defaults({ ease: 'ax.out', duration: 0.9 });

export { gsap, ScrollTrigger, SplitText, useGSAP };
