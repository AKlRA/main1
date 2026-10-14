import { createContext, useContext } from 'react';

/** True once the intro has started handing off (or immediately on repeat visits). */
export const IntroContext = createContext(true);

export const useIntroRevealed = () => useContext(IntroContext);
