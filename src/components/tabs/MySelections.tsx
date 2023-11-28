import { useAnnotationsStore } from "@/store/annotations";
import { useEar } from "@/store/earDetails";
import { Option, ProductType, Side } from "@/types/annotations.types";
import { useMemo } from "react";
import DraggbleComp from "../dnd/DraggableComp";

const MySelectionsTab = () => {
  const { annotations } = useAnnotationsStore();
  const { side } = useEar();
  const sideIndex = useMemo(() => (side === "R" ? "right" : "left"), [side]);

  const selectedProducts = Object.values(annotations[sideIndex])
    .reduce(
      (
        acc: (
          | {
              title: string;
              id: number;
              side: Side;
              price: string;
              variantId: number;
              shape: ProductType;
              images: { [position: string]: string };
              options: Option[];
            }
          | undefined
        )[],
        cur:
          | {
              title: string;
              id: number;
              side: Side;
              price: string;
              variantId: number;
              shape: ProductType;
              images: { [position: string]: string };
              options: Option[];
            }
          | undefined
      ) => {
        const exists = acc?.findIndex((p) => p?.id == cur?.id);
        if (exists === -1) {
          acc.push(cur);
        }
        return acc;
      },
      []
    )
    ?.filter(Boolean);
  return (
    <div className="flex gap-2 flex-wrap produc-exp-ui justify-left tab-inner">
      {selectedProducts?.map((product) => (
        <div className=" cursor-pointer" key={product?.id}>
          <div className=" p-2 bg-gray-100 rounded-md selection-area" key={product?.id}>
            <DraggbleComp id={product!.id.toString()}>
              <img
                src={product?.images["Dp"] ?? product?.images.dotsImage}
                alt=""
                className="w-full h-5/6 object-contain max-w-full"
              />
            </DraggbleComp>
          </div>
          <p className="text-base truncate lark-berry-title focus-inset selection-title">{product?.title}</p>
      <p className=" text-base truncate lark-berry-price selection-price">{product?.price}</p>
        </div>
      ))}
    </div>
  );
};
export default MySelectionsTab;
