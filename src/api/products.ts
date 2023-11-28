import { Image } from "@/components/tabs/data.type";

export const dummyProducts: {
  id: number;
  price: number;
  shape: "circle" | "dot" ;
  title: string;
  image: Image;
}[] = [
  // {
  //   title: "abc",
  //   id: 46169878135057,
  //   type: "circle",
  //   price: 586,
  //   image: {
  //     src: "https://clickthemart.com/storage/third.png",
  //   },
  // },
  {
    title: "def",
    id: 8631906173201,
    shape: "circle",
    price: 123,
    image: {
      // src: "https://clickthemart.com/storage/firstRingEdited.png",
      // src: "firstRingEdited.png",
      src: "imgs/F.png",
    },
  },
  {
    title: "ghi",
    id: 8631906173200,
    shape: "dot",
    price: 123,
    image: {
      src: "imgs/dot.png",
    },
  },
  {
    title: "ghi",
    id: 8631906173200,
    shape: "dot",
    price: 123,
    image: {
      src: "imgs/image (8).png",
    },
  },
  
];
