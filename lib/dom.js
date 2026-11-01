// True on phones/tablets (finger as the main pointer).
export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
