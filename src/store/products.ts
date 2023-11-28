import { create } from "zustand";
import { IProduct } from "../components/tabs/data.type";

interface IProductsStore {
  products: IProduct[];
  setProducts: (products: IProduct[]) => void;
}

export const useProductstore = create<IProductsStore>((set) => ({
  products: [],
  setProducts: (products: IProduct[]) => {
    set({
      products: [...products],
    });
  },
}));
