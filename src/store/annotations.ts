import { create } from "zustand";
// import { persist } from "zustand/middleware";
import { IAnnotation } from "../types/annotations.types";

interface IAnnotationStore {
  annotations: IAnnotation;
  setAnnotations: (annotation: IAnnotation) => void;
}

export const useAnnotationsStore = create<IAnnotationStore>((set) => ({
  annotations: {
    left: {},
    right: {},
  },
  setAnnotations: (annotation) => {
    set({
      annotations: { ...annotation },
    });
  },
}));
