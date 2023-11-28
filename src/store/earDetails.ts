import { create } from "zustand";
import { persist } from "zustand/middleware";

type Complex = "light" | "medium" | "dark" | "darkest";

interface IUseEar {
  side: "L" | "R";
  setSide: (newSide: "L" | "R") => void;
  colorComplex: Complex;
  setColorComplex: (newColorComplex: Complex) => void;
}

export const useEar = create<IUseEar>()(
  persist(
    (set) => ({
      side: "L",
      setSide: (newSide) => {
        set({
          side: newSide,
        });
      },
      colorComplex: "light",
      setColorComplex(newColorComplex) {
        set({
          colorComplex: newColorComplex,
        });
      },
    }),
    { name: "ear" }
  )
);
