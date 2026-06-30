import { createContext, useContext, useState, type ReactNode } from 'react';

interface ScrollContextType {
  scrollToTop: () => void;
  setScrollRef: (ref: HTMLDivElement | null) => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);

  const scrollToTop = () => {
    if (scrollRef) {
      scrollRef.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <ScrollContext.Provider value={{ scrollToTop, setScrollRef }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used within ScrollProvider');
  }
  return context;
}
