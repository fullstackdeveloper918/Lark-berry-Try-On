/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { callApi } from "@/api/config";
import { useEar } from "@/store/earDetails";
import { useProductDetailsStore } from "@/store/productDetails";
import { useProductstore } from "@/store/products";
import { Position } from "@/types/annotations.types";
import { dotPosition } from "@/types/annotations.types";
import { IVariant } from "@/types/variantData.types";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  DragMoveEvent,
  DragStartEvent,
  // closestCorners,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  dropPointsLeft,
  dropPointsRight,
  dropPointsLeftAddOnLeft,
  dropPointsRightAddOnRight,
  dropPointsForDotCrawleronRight,
  dropPointsForDotCrawleronLeft,
} from "../api/points";
import { useAnnotationsStore } from "../store/annotations";
// import BuyButton from "./BuyButton";
import BuyButton from "./BuyButton";
import Ear from "./Ear";
import OptionsMenu from "./OptionsMenu";
import DraggbleComp, {
  DraggableDotComp,
  DraggbleAddOnComp,
} from "./dnd/DraggableComp";
import DroppableComp, {
  DroppableAddOnComp,
  DroppableDotComp,
} from "./dnd/DroppableComp";
import Tabs from "./tabs";
import { IProduct } from "./tabs/data.type";
// import Loader from "react-js-loader";
import { useMediaQuery } from "react-responsive";
const View = () => {
  const earRef = useRef(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [addedProduts, setAddedProducts] = useState<
    { price: string; variantId: number; shape: string | undefined }[]
  >([]);
  // #TODO : changes needed to make dynamic
  const { products } = useProductstore();
  const annotations = useAnnotationsStore((state) => state.annotations);
  console.log(addedProduts);

  console.log(annotations, "anno");
  const setAnnotations = useAnnotationsStore((state) => state.setAnnotations);
  const { setProduct, product, showDetails, setShowDetails } =
    useProductDetailsStore();
  // const [dotPointsEnabled,setDotPointsEnabled] = useState();
  // const [showMessage, setShowMessage] = useState("");

  const [isDragging, setIsDragging] = useState("");
  const [activeId, setActiveId] = useState("");
  const [ringType, setRingType] = useState("");
  const [activeAddonPoints, setActiveAddonPoints] = useState<string[]>([]);
  console.log(product, "product");
  console.log(showDetails, "product");
  const [dragDataX, setDragDataY] = useState(0);
  const side = useEar((state) => state.side);
  const sideIndex = useMemo(
    () => (side === "L" ? ("left" as const) : ("right" as const)),
    [side]
  );
  const [currentPoint, setCurrentPoint] = useState<UniqueIdentifier>();
  const droppableRef = useRef(null);
  const addProductIdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessagePoints, setErrorMessagePoints] =
    useState<UniqueIdentifier>();
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  useEffect(() => {
    let timeoutId: string | number | NodeJS.Timeout | undefined;

    if (errorMessagePoints) {
      timeoutId = setTimeout(() => {
        setErrorMessagePoints("");
      }, 3000);
    }

    return () => clearTimeout(timeoutId);
  }, [errorMessagePoints]);
  useEffect(() => {
    if (annotations == undefined) return;
    const leftData = Object.values(annotations["left"])?.map((an) => ({
      price: an?.price ?? "0",
      variantId: an?.variantId,
      shape: an?.shape,
    }));
    const rightData = Object.values(annotations["right"])?.map((an) => ({
      price: an?.price ?? "0",
      variantId: an?.variantId,
      shape: an?.shape,
    }));

    const data = [...leftData, ...rightData];

    setAddedProducts(data);
  }, [annotations, sideIndex]);

  type PositionAddonMap = {
    A1: string;
    B1: string;
    C1: string;
    D1: string;
    E1: string;
    F1: string;
  };

  const positionAddonMap: PositionAddonMap = {
    A1: "A",
    B1: "B",
    C1: "C",
    D1: "D",
    E1: "E",
    F1: "F",
  };

  const checkIfCircle = (pos: string | number) => {
    const ifCircle = annotations[sideIndex][pos]?.shape === "circle";
    return ifCircle;
  };

  // Functions 👇👇👇
  async function addProducts(position: UniqueIdentifier, product: IProduct) {
    const productResponse = await callApi(`singleproducts/${product.id}`);
    if (productResponse.ok) {
      setProduct({
        id: product.id,
        position: position as Position,
        dotPosition: position as dotPosition,
      });
      setCurrentPoint(position);
      const variantData: { data: [{ variants: IVariant[] }] } =
        await productResponse.json();
      const normalized = variantData.data[0].variants[0];
      if (
        positionAddonMap[position as keyof PositionAddonMap] in
          annotations[sideIndex] &&
        checkIfCircle(positionAddonMap[position as keyof PositionAddonMap])
      ) {
        setAnnotations({
          ...annotations,
          [sideIndex]: {
            ...annotations[sideIndex],
            [position]: {
              title: product?.title,
              id: product?.id,
              price: normalized?.price,
              shape: product?.shape,
              variantId: normalized?.id,
              side: side,
              options: variantData?.data[0]?.variants,
              images: normalized.imagesAll,
              size: product?.size,
              type: product?.type,
            },
          },
        });
      } else if (
        (!(position in positionAddonMap) && product.shape === "circle") ||
        product.shape === "dot"
      ) {
        setAnnotations({
          ...annotations,
          [sideIndex]: {
            ...annotations[sideIndex],
            [position]: {
              title: product?.title,
              id: product?.id,
              price: normalized?.price,
              shape: product?.shape,
              variantId: normalized?.id,
              side: side,
              options: variantData?.data[0]?.variants,
              images: normalized.imagesAll,
              size: product?.size,
              type: product?.type,
            },
          },
        });
      } else {
        const productAddon =
          product.shape === "addon"
            ? "Place the hoop on the ear before adding a circle."
            : "";
        if (productAddon) {
          setErrorMessagePoints(productAddon);
        }
        setShowDetails(false);
      }
    }
  }

  console.log(annotations, "deter");

  
  const handleDragMove = (event: DragMoveEvent) => {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      active: { id },
      delta,
    } = event;
    console.log(id);
    if (delta.x > 10 || delta.x < -10) {
      setDragDataY(1);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  function handleDragStart(event: DragStartEvent) {
    setIsDragging(event.active.id.toString());
    setActiveId(event.active.id.toString());
    const data = products.find((p) => p.id == event.active.id);
    setRingType(data?.shape || "");
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging("");
    setRingType("");
    setDragDataY(1);
    const {
      over,
      active: { id },
    } = event;

    if (over && over.id) {
      if (
        [
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "A1",
          "B1",
          "C1",
          "D1",
          "E1",
          "F1",
          "DotB",
          "DotC",
          "DotD",
          "DotE",
          "DotF",
        ].includes(id.toString())
      ) {
        if (annotations[sideIndex][over.id]) {
          setProduct({
            id: annotations[sideIndex][id].id,
            position: over.id as Position,
            dotPosition: over.id as dotPosition,
          });
        }
        setShowDetails(true);
        setCurrentPoint(id);
      } else {
        const data = products.find((p) => p.id == id);
        const validPositionsByShape = {
          circle: ["A", "B", "C", "D", "E", "F"],
          dot: ["DotB", "DotC", "DotD", "DotE", "DotF"],
          addon: ["A1", "B1", "C1", "D1", "E1", "F1"],
        };
        if (data) {
          const validPositions = validPositionsByShape[data?.shape];
      
          if (validPositions && validPositions.includes(over?.id.toString())) {
            const addonPosition = validPositionsByShape["addon"][
              validPositions.indexOf(over?.id.toString())
            ];
            setActiveAddonPoints((prevPoints) => [...prevPoints, addonPosition]);
            addProducts(over?.id, data);
            setIsLoading(true);
            setShowDetails(true);
            setErrorMessagePoints("");
          }else {
            setShowDetails(false);
            setIsLoading(false);
            setActiveAddonPoints([]);
      
            let errorMessage = "";
      
            if (data?.shape === "circle") {
              errorMessage =
                "Position the earring specifically on the highlighted circle of the ear to enhance your overall appearance.";
            } else if (data?.shape === "dot") {
              errorMessage =
                "Position the earring specifically on the highlighted dot of the ear to enhance your overall appearance.";
            } else if (data?.shape === "addon") {
              errorMessage =
                "Place the earring on a highlighted area of the ear to curate your look.";
            }
      
            setErrorMessagePoints(errorMessage);
          }
        
          setTimeout(() => {
            setIsLoading(false);
          }, 2000);
        }
      }
    }
  }

  function remove() {
    setShowDetails(false);
    if (currentPoint) {
      const { [currentPoint]: removedPoint, ...restAnnotations } =
        annotations[sideIndex];
      let modifiedKey = currentPoint + "1";
      const {
        [modifiedKey]: removedModifiedPoint,
        ...restModifiedAnnotations
      } = restAnnotations;
      setAnnotations({
        ...annotations,
        [sideIndex]: restModifiedAnnotations,
      });

      console.log("currentPoint++", currentPoint);
      setCurrentPoint("");
    }
  }

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      delay: 0,
      tolerance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 0,
      tolerance: 5,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);
 
  const corresponsingPosMap: any = {
    A1: "A",
    B1: "B",
    C1: "C",
    E1: "E",
    D1 : "D",
    F1 : "F"
  };

  const getEarringStyleByType = (
    earringType: unknown,
    size: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pos: any
  ) => {
    let transform = "";
    let width = "30px";
    let clipPath = "";
    let circleEarringType = "";
    if (["A1", "B1", "C1", "E1", "D1","F1"].includes(pos)) {
      circleEarringType =
        annotations[sideIndex][corresponsingPosMap[pos] as any]?.type || "";
    } else {
      circleEarringType = earringType as string; 
    }

    console.log(annotations[sideIndex][pos]?.type, "annotitle");
    console.log(earringType, "earringType");
    console.log(circleEarringType, "circleEarringType");

    if (side === "L") {
      switch (pos) {
        case "D":
        case  "D1" : 
          switch (circleEarringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(7px, 47px) rotate(30deg)"
                  : size === "small"
                  ? "translate(7px, 47px) rotate(30deg)"
                  : "translate(7px, 47px) rotate(30deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "27px" : "28px";

              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate(11px, 12px) rotate(-122deg)"
                  : size === "small"
                  ? "translate(11px, 12px) rotate(-122deg)"
                  : "translate(11px, 12px) rotate(-122deg)";
              width =
                size === "large" ? "32px" : size === "small" ? "32px" : "33px";
              break;
            case "STUD":
              transform =
                size === "large"
                  ? "translate3d(18px, 23px, 0px) rotate(19deg)"
                  : size === "small"
                  ? "translate3d(18px, 23px, 0px) rotate(19deg)"
                  : "translate3d(18px, 23px, 0px) rotate(19deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "KNIFE_EDGED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(15px, 5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 14% 23%, 39% 34%, 62% 13%, 41% 0, 100% 0, 100% 41%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(14px, 5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 14% 17px, 53% 16%, 33% -13%, 93% 24%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 5px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 8% 16%, 36% 24%, 67% 11%, 38% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 8px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 12% 16px, 35% 23%, 64% -5%, 88% 24%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(18px, 6px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 15%, -32% 22%, 41% 19%, 15% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(18px, 6px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 15%, -32% 22%, 41% 19%, 15% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 0px 16%, 42% 25%, 76% 14%, 37% 1%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(20px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 0px 16%, 42% 24%, 84% 23%, 33% 2%, 97% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, 6px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -21px 36%, 75% 20%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, 6px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -21px 36%, 75% 20%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 8px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 12% 16px, 35% 23%, 64% -5%, 88% 24%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, 6px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 20%, 56% 25%, 37% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(19px, 6.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 23%, 0px 34%, 53% 17%, 51% 9%, 37% 0px, 100% 0px, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(16px, 6.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 12%, 56% 23%, 34% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;

                default:
                  transform =
                size === "large"
                  ? "translate3d(19px, 12px, 0px) rotate(-1deg)"
                  : size === "small"
                  ? "translate3d(19px, 12px, 0px) rotate(-1deg)"
                  : "translate3d(19px, 12px, 0px) rotate(-1deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "22px" : "22px";
              break;
              }
              break;             
            case "MODERN_COLOUR":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(9px, 7px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "22px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 1%, 63% 0, 41% 11%, 65% 34%, 91% 21%, 99% 0, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(4px, 7px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "35px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 32%, 91% 21%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, 5px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 63% 0px, 41% 11%, 65% 26%, 87% 21%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 7px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 32%, 54% 26%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, 6px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 35% 0, 23% 9%, 38% 18%, 62% 13%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 99%, 0 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(10px, 6px) rotate(9deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 35% 0, 23% 9%, 38% 18%, 62% 13%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 99%, 0 48%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(11px, 5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 63% 0px, 41% 11%, 65% 26%, 94% 12%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(11px, 5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 63% 0px, 41% 11%, 65% 26%, 94% 11%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 7px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 32%, 54% 26%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 6px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 47% 0, 38% 9%, 59% 19%, 82% 9%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 53%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(6px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 50% 0px, 42% 5%, 62% 17%, 78% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";

                  break;

                default:
                  transform =
                  size === "large"
                    ? "translate3d(11px, 9px, 0px)"
                    : size === "small"
                    ? "translate3d(11px, 9px, 0px)"
                    : "translate3d(13px, 11px, 0px)";
  
                width =
                  size === "large" ? "34px" : size === "small" ? "22px" : "31px";
                break;
              }
              break;             
            case "BRUSHED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 12px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "19px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 44% 0, 34% 14%, 63% 25%, 78% 3%, 100% 0, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(8px, 13px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 36% 14%, 47% 17%, 78% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 11px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 36% 14%, 61% 30%, 78% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(7px, 13px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 47% 15%, 78% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 12px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 22% 14%, 94% 30%, 78% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 12px) rotate(9deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 29% 14%, 92% 16%, 78% 4%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(14px, 12px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 36% 14%, 72% 32%, 86% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(14px, 12px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "15px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 72% 32%, 86% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, 13px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% -5px, 53% 17%, 47% 17%, 74% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5px, 13px) rotate(4deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% -5px, 53% 17%, 47% 17%, 88% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(7px, 13px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 47% 15%, 78% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(7px, 13px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 47% 17%, 75% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 11px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 36% 14%, 49% 30%, 84% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(7px, 13px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 47% 17%, 75% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;

                default:
                  transform =
                  size === "large"
                    ? "translate3d(18px, 17px, 0px)"
                    : size === "small"
                    ? "translate3d(18px, 18px, 0px)"
                    : "translate3d(18px, 17px, 0px)";
  
                width =
                  size === "large" ? "18px" : size === "small" ? "22px" : "18px";
                break;
              }
              break;            
            case "SIMPLE_HOOP":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 12px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "19px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 44% 0, 34% 14%, 63% 25%, 78% 3%, 100% 0, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(6px, 14px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 48% 0, 39% 13%, 60% 22%, 72% 8%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 11px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 36% 14%, 61% 30%, 78% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(6px, 13px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 48% 0, 39% 13%, 60% 18%, 72% 8%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 14px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 22% 14%, 94% 27%, 78% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 12px) rotate(9deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 29% 14%, 92% 16%, 78% 4%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(14px, 12px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 38% 14%, 72% 32%, 86% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(14px, 12px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "15px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 72% 32%, 86% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, 13px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 55% 0, 46% 9%, 66% 18%, 78% 6%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 43%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, 13px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 55% 0, 46% 9%, 66% 18%, 78% 6%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 43%)"
                      : "";
                  break;
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(7px, 13px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 47% 15%, 78% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(7px, 13px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 47% 17%, 81% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(12px, 14px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 44% 0px, 36% 14%, 49% 30%, 84% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(7px, 13px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 44% 0px, 36% 14%, 47% 17%, 105% 3%, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;

                default:
                  transform =
                size === "large"
                  ? "translate3d(13px, 15px, 0px)"
                  : size === "small"
                  ? "translate3d(13px, 15px, 0px)"
                  : "translate3d(17px, 9px, 0px)";

              width =
                size === "large" ? "28px" : size === "small" ? "22px" : "25px";
              break;
              }
              break;            
            case "TWISTED_GOLD":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(12px, 8px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "22px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 47% 0px, 41% 11%, 65% 34%, 91% 21%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(2px, 8px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "40px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 32%, 91% 21%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, 8px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 54% 0px, 41% 11%, 65% 26%, 87% 21%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(2px, 7px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "40px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 32%, 54% 26%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 9px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 35% 0, 23% 9%, 38% 18%, 62% 13%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 99%, 0 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 9px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 35% 0, 23% 9%, 38% 18%, 62% 13%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 99%, 0 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, 7px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 63% 0px, 41% 11%, 65% 26%, 100% 22%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(10px, 7px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "20px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 63% 0px, 38% 9%, 65% 26%, 100% 18%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 8px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(2px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "40px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 50% 0px, 41% 10%, 59% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(2px, 7px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "40px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 32%, 54% 26%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(6px, 8px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 45% 0px, 41% 10%, 59% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 8px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 47% 0, 38% 9%, 59% 19%, 82% 9%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 53%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "40px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 50% 0px, 42% 5%, 62% 17%, 78% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";

                  break;

                default:
                  transform =
                  size === "large"
                    ? "translate3d(16px, 5px, 0px)"
                    : size === "small"
                    ? "translate3d(16px, 9px, 0px)"
                    : "translate3d(16px, 9px, 0px)";
  
                width =
                  size === "large" ? "26px" : size === "small" ? "22px" : "28px";
                break;
              }
              break;          
            default:
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(9px, 6px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "25px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 46% 0, 39% 12%, 72% 34%, 81% 22%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(3px, 7px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "40px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 43% 0, 39% 11%, 56% 34%, 66% 24%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(11px, 7px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 42% 1%, 32% 14%, 63% 32%, 84% 15%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(2px, 7px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "40px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 45% 0px, 41% 10%, 59% 32%, 54% 26%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 7px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 1%, 23% 0, 23% 11%, 40% 19%, 62% 9%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(6px, 7px) rotate(9deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "35px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? " polygon(0 1%, 23% 0, 30% 11%, 40% 19%, 62% 9%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(11px, 5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 48% 0px, 41% 11%, 60% 38%, 99% 12%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(11px, 5px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "20px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 48% 0px, 41% 11%, 60% 38%, 99% 12%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 48% 0px, 41% 10%, 59% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 48% 0px, 41% 10%, 66% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(2px, 7px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "40px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 45% 0px, 41% 10%, 59% 32%, 54% 26%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(4px, 6px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "35px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 54% 0px, 41% 10%, 59% 25%, 84% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(9px, 6px) rotate(0deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 40% 0px, 41% 10%, 59% 32%, 54% 26%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(3px, 7px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "40px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 1%, 50% 0px, 42% 5%, 62% 17%, 78% 0%, 99% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";

                  break;

                default:
                  transform =
                  size === "large"
                    ? "translate3d(25px, 5px, 0px)"
                    : size === "small"
                    ? "translate3d(19px, 12px, 0px)"
                    : "translate3d(23px, 10px, 0px)";
  
                width =
                  size === "large" ? "30px" : size === "small" ? "21px" : "26px";
  
                break;
              }
              break;         
          }
          break;
        case "DotD":
          switch (earringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(7px, 45px) rotate(30deg)"
                  : size === "small"
                  ? "translate(7px, 45px) rotate(30deg)"
                  : "translate(7px, 45px) rotate(30deg)";
              width =
                size === "large" ? "32px" : size === "small" ? "31px" : "32px";

              break;
            case "DIAMONDCRAWLER":
              transform =
                size === "large"
                  ? "translate(14px, 21px) rotate(234deg)"
                  : size === "small"
                  ? "translate(14px, 21px) rotate(234deg)"
                  : "translate(14px, 21px) rotate(234deg)";
              width =
                size === "large" ? "32px" : size === "small" ? "30px" : "32px";

              break;
            case "DIAMOND_CRAWLER":
              transform =
                size === "large"
                  ? "translate(7px, 19px) rotate(165deg)"
                  : size === "small"
                  ? "translate(7px, 19px) rotate(165deg)"
                  : "translate(7px, 19px) rotate(165deg)";
              width =
                size === "large" ? "32px" : size === "small" ? "31px" : "32px";

              break;

            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate(14px, 6px) rotate(180deg)"
                  : size === "small"
                  ? "translate(11px, 11px) rotate(198deg)"
                  : "translate(11px, 0px) rotate(16deg)";
              width =
                size === "large" ? "25px" : size === "small" ? "30px" : "33px";
              break;
            case "Constellation":
              transform =
                size === "large"
                  ? "translate(11px, 15px) rotate(-133deg)"
                  : size === "small"
                  ? "translate(15px, -3px) rotate(-176deg)"
                  : "translate(11px, 15px) rotate(-133deg)";
              width =
                size === "large" ? "23px" : size === "small" ? "21px" : "22px";
              break;
            case "Star_Chain":
              transform =
                size === "large"
                  ? "translate(15px, -3px) rotate(360deg)"
                  : size === "small"
                  ? "translate(15px, -3px) rotate(360deg)"
                  : "translate(15px, -3px) rotate(360deg)";
              width =
                size === "large" ? "23px" : size === "small" ? "21px" : "22px";
              break;
            case "STUDSTAR":
              transform =
                size === "large"
                  ? "translate3d(18px, 23px, 0px) rotate(19deg)"
                  : size === "small"
                  ? "translate(12px, 17px) rotate(361deg)"
                  : "translate3d(18px, 23px, 0px) rotate(19deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDLIGHTNING":
              transform =
                size === "large"
                  ? "translate(13px, 12px) rotate(21deg)"
                  : size === "small"
                  ? "translate(13px, 12px) rotate(21deg)"
                  : "translate(13px, 12px) rotate(21deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDMINI":
              transform =
                size === "large"
                  ? "translate3d(18px, 23px, 0px) rotate(19deg)"
                  : size === "small"
                  ? "translate(7px, 25px) rotate(30deg)"
                  : "translate3d(18px, 23px, 0px) rotate(19deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "30px" : "30px";
              break;
            case "STUDMOON":
              transform =
                size === "large"
                  ? "translate3d(18px, 23px, 0px) rotate(19deg)"
                  : size === "small"
                  ? "translate3d(11px, 14px, 0px) rotate(189deg)"
                  : "translate3d(18px, 23px, 0px) rotate(19deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "27px" : "27px";
              break;
            case "KNIFE_EDGED":
              transform =
                size === "large"
                  ? "translate3d(-23px, 0px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 12px, 0px)"
                  : "translate3d(-16px, 5px, 0px)";
              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "MODERN_COLOUR":
              transform =
                size === "large"
                  ? "translate3d(-23px, 12px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 24px, 0px)"
                  : "translate3d(-16px, 22px, 0px)";

              width =
                size === "large" ? "34px" : size === "small" ? "22px" : "28px";
              break;
            case "BRUSHED":
              transform =
                size === "large"
                  ? "translate3d(-20px, -3px, 0px)"
                  : size === "small"
                  ? "translate3d(-13px, 16px, 0px)"
                  : "translate3d(-14px, 8px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "SIMPLE_HOOP":
              transform =
                size === "large"
                  ? "translate3d(-20px, 6px, 0px)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "TWISTED_GOLD":
              transform =
                size === "large"
                  ? "translate3d(-16px, 3px, 0px)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            default:
              transform =
                size === "large"
                  ? "translate3d(-16px, 8px, 0px)"
                  : size === "small"
                  ? "translate3d(-13px, 16px, 0px)"
                  : "translate3d(-16px, 12px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";

              break;
          }
          break;
        // case "D1":
        //   switch (earringType) {
        //     case "TRIODIAMOND":
        //       transform =
        //         size === "large"
        //           ? "translate(10px, 3px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(10px, 3px) rotate(0deg)"
        //           : "translate(10px, 3px) rotate(0deg)";
        //       width =
        //         size === "large" ? "24px" : size === "small" ? "22px" : "23px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 12px, 72% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";

        //       break;
        //     case "ENTRANCING":
        //       transform =
        //         size === "large"
        //           ? "translate(12px, 12px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(12px, 12px) rotate(0deg)"
        //           : "translate(12px, 12px) rotate(0deg)";
        //       width =
        //         size === "large" ? "24px" : size === "small" ? "22px" : "23px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 12px, 72% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "CROSS":
        //       transform =
        //         size === "large"
        //           ? "translate(12px, 5px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(12px, 5px) rotate(0deg)"
        //           : "translate(12px, 5px) rotate(0deg)";
        //       width =
        //         size === "large" ? "24px" : size === "small" ? "22px" : "23px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 3px, 65% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "PEACE":
        //       transform =
        //         size === "large"
        //           ? "translate(13px, 7px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(9px, 11px) rotate(0deg)"
        //           : "translate(13px, 7px) rotate(0deg)";
        //       width =
        //         size === "large" ? "24px" : size === "small" ? "22px" : "23px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(92% 5px, -60% -5px, 103% 38%, 100% 71%, 88% 101%, 28% 100%, -13% 101%, 6% 29%, 94% -1px, 36% -12%)"
        //           : "";
        //       break;
        //     case "SHOOTING":
        //       transform =
        //         size === "large"
        //           ? "translate(14px, 14px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(9px, 11px) rotate(11deg)"
        //           : "translate(14px, 14px) rotate(0deg)";
        //       width =
        //         size === "large" ? "24px" : size === "small" ? "22px" : "23px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(52% 43px, -9% -13px, 87% 18%, 109% 80%, 91% 106%, 39% 100%, -42% 101%, 6% 29%, 94% -1px, 36% -12%)"
        //           : "";
        //       break;
        //     case "PRECIOUS":
        //       transform =
        //         size === "large"
        //           ? "translate(13px, 7px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(14px, 6px) rotate(0deg)"
        //           : "translate(13px, 7px) rotate(0deg)";
        //       width =
        //         size === "large" ? "17px" : size === "small" ? "15px" : "17px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(41% -15px, 61% 0px, 100% 67%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "DARLING":
        //       transform =
        //         size === "large"
        //           ? "translate(13px, 7px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(15px, 7px) rotate(0deg)"
        //           : "translate(13px, 7px) rotate(0deg)";
        //       width =
        //         size === "large" ? "24px" : size === "small" ? "13px" : "23px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 12px, 72% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "MARVELOUS":
        //       transform =
        //         size === "large"
        //           ? "translate(11px, 11px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(11px, 11px) rotate(0deg)"
        //           : "translate(14px, 14px) rotate(0deg)";
        //       width =
        //         size === "large" ? "24px" : size === "small" ? "22px" : "23px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% -12px, 88% 53px, 100% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "PLANET":
        //       transform =
        //         size === "large"
        //           ? "translate(13px, 7px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(12px, 12px) rotate(0deg)"
        //           : "translate(13px, 7px) rotate(0deg)";
        //       width =
        //         size === "large" ? "17px" : size === "small" ? "20px" : "17px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 12px, 72% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "PEACESIGN":
        //       transform =
        //         size === "large"
        //           ? "translate(13px, 7px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(12px, 12px) rotate(0deg)"
        //           : "translate(13px, 7px) rotate(0deg)";
        //       width =
        //         size === "large" ? "22px" : size === "small" ? "22px" : "22px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 12px, 72% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "HAND":
        //       transform =
        //         size === "large"
        //           ? "translate(13px, 7px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(12px, 12px) rotate(0deg)"
        //           : "translate(13px, 7px) rotate(0deg)";
        //       width =
        //         size === "large" ? "22px" : size === "small" ? "22px" : "22px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 12px, 72% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "CELESTIAL":
        //       transform =
        //         size === "large"
        //           ? "translate(13px, 7px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(12px, 10px) rotate(0deg)"
        //           : "translate(13px, 10px) rotate(0deg)";
        //       width =
        //         size === "large" ? "22px" : size === "small" ? "22px" : "22px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 12px, 72% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //     case "SUMMER":
        //       transform =
        //         size === "large"
        //           ? "translate(13px, 7px) rotate(0deg)"
        //           : size === "small"
        //           ? "translate(12px, 12px) rotate(0deg)"
        //           : "translate(13px, 10px) rotate(0deg)";
        //       width =
        //         size === "large" ? "22px" : size === "small" ? "22px" : "22px";
        //       clipPath =
        //         size === "large"
        //           ? ""
        //           : size === "small"
        //           ? "polygon(100% 12px, 72% 0px, 103% 38%, 100% 71%, 88% 94%, 59% 100%, 22% 101%, 0% 62%, 24% -2px, 66% 29%)"
        //           : "";
        //       break;
        //   }

          break;
        case "A":
        case "A1":
          switch (circleEarringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(-65px, 44px) rotate(64deg)"
                  : size === "small"
                  ? "translate(57px, 44px) rotate(14deg)"
                  : "translate(-65px, 44px) rotate(64deg)";
              width =
                size === "large" ? "50px" : size === "small" ? "30px" : "40px";
              break;
            case "KNIFE_EDGED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(4px, -3px) rotate(-4deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 14% 0px, 29% 26%, 60% 15%, 47% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(0px, -2px) rotate(0deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 14% 3px, 40% 27%, 60% 15%, 47% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, -2.1px) rotate(0deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 14% 3px, 38% 28%, 60% 15%, 47% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -1px) rotate(0deg)"
                      : size === "small"
                      ? "translate(0px, -2px) rotate(0deg)"
                      : "translate(5px, -1px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 14% 3px, 19% 25%, 60% 15%, 47% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-1px, -2px) rotate(12deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 25% 17%, 46% 12%, 34% 0px, 78% 0px, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -4px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 37%, 2% 16%, 45% 20%, 28% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -3px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, -15% -4px, 28% 22%, 78% 19%, 44% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -3px) rotate(0deg)"
                      : "translate(17px, -4px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, -10% -4px, 28% 22%, 78% 19%, 44% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-3px, -3px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 28% 1%, 46% 21%, 65% 18%, 56% 0, 100% 0, 100% 55%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 39%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, -2px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(51% 1px, 84% -3px, 99% 51%, 93% 88%, 78% 94%, 68% 102%, 26% 97%, -4% 75%, 10% 3px, 66% 29%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(0px, -3px) rotate(3deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 29%, -8px 22%, 63% 21%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(0px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 13%, 60% 23%, 41% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 23%, 0 10%, 43% 17%, 51% 9%, 37% 0, 100% 0, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-1px, -2px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 18%, -8px 7%, 62% 22%, 50% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate3d(1px, 5px, 0px)rotate(10deg)"
                      : size === "small"
                      ? "translate3d(1px, 5px, 0px)"
                      : "translate3d(1px, 5px, 0px)rotate(10deg)";
                  width =
                    size === "large"
                      ? "41px"
                      : size === "small"
                      ? "41px"
                      : "41px";
                  break;
              }
              break;
            case "MODERN_COLOUR":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(15px, -4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 20%, 31% 27%, 52% 14%, 0 1%, 67% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -3px) rotate(-3deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 23%, 49% 28%, 55% 9%, 0 1%, 67% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(17px, -3.1px) rotate(0deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, -3% 24%, 32% 21%, 62% 20%, 28% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 36% 100%, 0px 100%, 0px 45%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -3px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -7px 8px, 56% 19%, 40% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(16px, -4px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 3% 17%, 41% 19%, 15% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -4px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 37%, 2% 16%, 45% 20%, 28% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(17px, -4px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, -15% 7px, 28% 21%, 73% 16%, 11% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -3px) rotate(0deg)"
                      : "translate(17px, -4px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, 5% 7px, 27% 19%, 73% 11%, 6% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, -3px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -22px 20%, 61% 20%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -2px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(51% 0px, 87% -15px, 99% 42%, 97% 71%, 88% 94%, 58% 100%, 26% 97%, -4% 75%, 10% 3px, 66% 29%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, -2.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 29%, -8px 22%, 63% 21%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 12%, 56% 23%, 34% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, -2.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 23%, 0 10%, 43% 17%, 51% 9%, 37% 0, 100% 0, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 18%, -8px 17%, 62% 22%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(7px, -2px, 0px)"
                      : size === "small"
                      ? "translate3d(7px, -2px, 0px)"
                      : "translate3d(4px, -1px, 0px)rotate(3deg)";

                  width =
                    size === "large"
                      ? "47px"
                      : size === "small"
                      ? "47px"
                      : "47px";
                  break;
              }
              break;
            case "BRUSHED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(6px, -5px) rotate(-11deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "25px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 29% 2%, 30% 25%, 64% 20%, 56% 0, 100% 0, 100% 46%, 100% 70%, 100% 100%, 0 100%, 0 66%, 0 42%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, -4px) rotate(-3deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(8px 22%, 2% 9%, 49% 22%, 51% 0px, 100% 0px, 100% 25%, 100% 50%, 99% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 42%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, -3.1px) rotate(0deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 24%, -2% 11%, 39% 19%, 63% 19%, 33% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 36% 100%, 0px 100%, 0px 45%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -3px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -7px 0px, 56% 19%, 45% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, -3px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 1% 8%, 42% 19%, 25% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, -4px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 37%, 1% 8%, 44% 20%, 32% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, -4px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 25%, 7% 0, 29% 19%, 71% 17%, 41% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -3px) rotate(0deg)"
                      : "translate(8px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 25%, 7% 0, 29% 19%, 71% 17%, 41% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, -3px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -2px 10%, 65% 20%, 43% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -4px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(55% 2px, 72% -5px, 103% 38%, 100% 71%, 88% 94%, 58% 100%, 26% 97%, -4% 75%, 10% 3px, 66% 29%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, 0px 14%, 59% 21%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, -4px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 25%, 1% 4%, 57% 22%, 51% 0, 100% 0, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, -4px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(39% 0px, 64% 0px, 100% 38%, 100% 71%, 88% 94%, 58% 100%, 26% 97%, -4% 75%, 10% 3px, 66% 29%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "28px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 20%, -5px 10%, 60% 20%, 45% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate3d(6px, -8px, 0px) rotate(0deg)"
                      : size === "small"
                      ? "translate3d(6px, 7px, 0px) rotate(4deg)"
                      : "translate3d(6px, -9px, 0px) rotate(2deg)";

                  width =
                    size === "large"
                      ? "36px"
                      : size === "small"
                      ? "38px"
                      : "36px";
              }
              break;
            case "SIMPLE_HOOP":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(4px, -3px) rotate(-2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 17% 2px, 47% 38%, 60% 15%, 47% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, -3px) rotate(0deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 15% 1px, 40% 27%, 62% 17%, 48% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -3.1px) rotate(0deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 14% 4px, 45% 28%, 60% 15%, 47% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -1px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, -3px) rotate(0deg)"
                      : "translate(5px, -1px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 12% 16px, 17% 19%, 54% 15%, 47% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, -2.5px) rotate(11deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 25% 20%, 40% 10%, 28% 0px, 78% 0px, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, -2.5px) rotate(11deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1%, 25% 20%, 40% 10%, 28% 0px, 78% 0px, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -3px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, -18% -7px, 21% 14%, 78% 19%, 44% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -3px) rotate(0deg)"
                      : "translate(17px, -4px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, -18% -7px, 19% 11%, 78% 19%, 44% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-2px, -3px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 28% 1%, 46% 21%, 65% 18%, 56% 0, 100% 0, 100% 55%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 39%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, -3.5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(51% 1px, 84% -3px, 99% 51%, 93% 88%, 78% 94%, 68% 102%, 26% 97%, -4% 75%, 10% 3px, 66% 29%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 12% 16px, 17% 19%, 54% 15%, 47% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, 1% 11%, 66% 23%, 38% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, -4px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 23%, 0px 7%, 43% 17%, 51% 9%, 37% 0px, 100% 0px, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, -3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 18%, -8px 7%, 62% 22%, 50% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(4px, 8px, 0px) rotate(1deg)"
                      : size === "small"
                      ? "translate3d(4px, 8px, 0px) rotate(1deg)"
                      : "translate3d(-2px, 10px, 0px) rotate(-2deg)";

                  width =
                    size === "large"
                      ? "40px"
                      : size === "small"
                      ? "35px"
                      : "38px";
                  break;
              }
              break;
            case "STUD":
              transform =
                size === "large"
                  ? "translate(-20%, 30%) rotate(0deg)"
                  : size === "small"
                  ? "translate3d(63px, 38px, 0px)"
                  : "translate(-20%, 30%) rotate(0deg)";
              width =
                size === "large" ? "35px" : size === "small" ? "22px" : "32px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(63px, 19px, 0px) rotate(67deg)"
                  : size === "small"
                  ? "translate3d(63px, 25px, 0px) rotate(89deg)"
                  : "translate3d(63px, 25px, 0px) rotate(89deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "28px" : "40px";
              break;
            case "TWISTED_GOLD":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(3px, 0px) rotate(-1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 46% 0px, 40% 15%, 55% 29%, 95% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(0px, -1px) rotate(-9deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 46% 0px, 40% 15%, 55% 29%, 95% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5.5px, -1px) rotate(-6deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 43% 0px, 36% 14%, 41% 22%, 95% 13%, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-1px, -1px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 43% 0px, 36% 14%, 41% 22%, 95% 13%, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -2px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 20% 0, 23% 15%, 43% 17%, 54% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -2px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 3px, 32% 2px, 43% 20%, 39% 16%, 86% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -1px) rotate(2deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 37% 0px, 25% 15%, 43% 17%, 80% 17%, 97% 3px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -1px) rotate(1deg)"
                      : "translate(17px, -4px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 37% 0px, 25% 15%, 43% 17%, 80% 17%, 97% 3px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-1px, -1px) rotate(-2deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 46% 0px, 43% 16%, 79% 11%, 91% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-2px, -1px) rotate(1deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 46% 0px, 43% 16%, 66% 19%, 86% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-1px, -0.5px) rotate(-3deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 46% 0px, 43% 16%, 66% 19%, 86% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-1px, -1px) rotate(-2.5deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 46% 0px, 43% 16%, 66% 19%, 86% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, -1px) rotate(-5deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 46% 0px, 43% 16%, 66% 19%, 86% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(-3px, 0px) rotate(-3deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "34px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 21%, 0px 0px, 46% 0px, 46% 22%, 64% 16%, 86% 14%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 44%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(9px, 6px, 0px) rotate(174deg)"
                      : size === "small"
                      ? "translate3d(-13px, 21px, 0px)"
                      : "translate3d(-14px, 11px, 0px)";

                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "22px"
                      : "23px";
                  break;
              }
              break;
            default:
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, -4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 4% 9%, 54% 30%, 62% 13%, 34% 0, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(11px, -4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 2px, -5% 39%, 61% 30%, 62% 13%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, -4px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, -4% 9%, 54% 30%, 62% 13%, 34% 0, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -7px 5px, 56% 19%, 40% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -5px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 3% 15%, 41% 19%, 13% -1px, 68% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(9px, -5px) rotate(9deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 29%, 3% 15%, 41% 19%, 13% -1px, 68% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(14px, -5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, -17% 9%, 54% 30%, 62% 13%, 16% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(14px, -5px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "15px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(1% 0px, -9% 9%, 54% 30%, 62% 13%, 16% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, -5px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -18px 8%, 61% 20%, 38% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(7px, -5px) rotate(4deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 26%, 13px 21%, 64% 20%, 38% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(7px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(6px, -5px) rotate(0deg)"
                    : "translate(7px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 26%, -7px 5px, 56% 19%, 40% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, -5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, 11% 12%, 55% 23%, 31% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 23%, 0 10%, 43% 17%, 51% 9%, 37% 0, 100% 0, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -5.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 18%, -5px 24%, 57% 20%, 37% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(2px, -0.5px, 6px) rotate(363deg)"
                      : size === "small"
                      ? "translate3d(1px, 8.5px, 6px) rotate(366deg)"
                      : "translate3d(6px, -2.5px, 6px) rotate(369deg)";

                  width =
                    size === "large"
                      ? "44px"
                      : size === "small"
                      ? "40px"
                      : "45px";
                  break;
              }
              break;
          }
          break;
        case "B":
        case "B1":
          switch (circleEarringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(15px, 13px) rotate(104deg)"
                  : size === "small"
                  ? "translate(24px, 13px) rotate(1deg)"
                  : "translate(15px, 13px) rotate(104deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "30px" : "28px";
              break;
            case "KNIFE_EDGED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(8px, -7px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 84% -1px, 42% 20%, 63% 43%, 91% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 29% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, -5px) rotate(0deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1px, 67% 0px, 37% 13%, 80% 36%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -6px) rotate(0deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 64% 0px, 29% 26%, 101% 28%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 37% 26%, 83% 23%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -5px) rotate(17deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% -4px, 19% 13%, 100% 29%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -5px) rotate(17deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% -4px, 19% 13%, 100% 29%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -7px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 53% 43%, 101% 21%, 97% 28%, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -7px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 53% 43%, 101% 21%, 97% 28%, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -6px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "26px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -6px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "26px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 30%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 37% 26%, 83% 23%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 30%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, -7px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 71% 0px, 37% 13%, 72% 22%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -5px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate3d(-23px, 0px, 0px)"
                      : size === "small"
                      ? "translate3d(-22px, 12px, 0px)"
                      : "translate3d(5px, 8px, 0px) rotate(1deg)";
                  width =
                    size === "large"
                      ? "64px"
                      : size === "small"
                      ? "62px"
                      : "63px";
                  break;
              }
              break;

            case "MODERN_COLOUR":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(9px, -9px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 28%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, -9px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 28%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, -11px) rotate(2deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 93% 0px, 36% 17%, 101% 28%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -9px) rotate(2deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -9px) rotate(15deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% -4px, 19% 13%, 86% 16%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, -9.5px) rotate(5deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 65% -2px, 28% 13%, 90% 19%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -12px) rotate(5deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 88% 0px, 47% 27%, 101% 21%, 97% 28%, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -12px) rotate(5deg)"
                      : "translate(8px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 88% 0px, 47% 27%, 101% 21%, 97% 28%, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, -10px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "26px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 83% 0px, 37% 14%, 65% 20%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, -10px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "26px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(3px 1px, 89% -1px, 43% 13%, 50% 27%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -9px) rotate(2deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, -10px) rotate(2deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 52% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(0px, -11px) rotate(2deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 80% 0px, 37% 13%, 71% 17%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, -9px) rotate(2deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate3d(22px, 26px, 0px) rotate(44deg)"
                      : size === "small"
                      ? "translate3d(22px, 26px, 0px) rotate(44deg)"
                      : "translate3d(9px, 8px, 0px) rotate(16deg)";

                  width =
                    size === "large"
                      ? "34px"
                      : size === "small"
                      ? "34px"
                      : "38px";
                  clipPath =
                    size === "small"
                      ? ""
                      : size === "large"
                      ? ""
                      : "polygon(0 0, 36% 38%, 72% 26%, 17% 1%, 100% 0, 100% 25%, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 41%)";
                  break;
              }
              break;
            case "BRUSHED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(21px, -3.1px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(66% 0, 84% 6%, 49% 10%, 65% 33%, 94% 26%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 3% 0)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, -3.1px) rotate(3deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(66% 0px, 84% 6%, 49% 10%, 61% 32%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(21px, -3.1px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "12px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(66% 0px, 84% 6%, 49% 10%, 74% 29%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, -3.1px) rotate(3deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(66% 0px, 70% 3%, 49% 10%, 65% 30%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, -2.1px) rotate(15deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(2% 0, 37% 0, 27% 7%, 40% 17%, 59% 13%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, -2.1px) rotate(15deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(2% 0, 37% 0, 27% 7%, 40% 17%, 59% 13%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(22px, -3.1px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "12px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 25%, 0 0, 88% 0, 25% 21%, 100% 19%, 100% 28%, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(22px, -3.5px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "12px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 25%, 0 0, 88% 0, 25% 21%, 100% 19%, 100% 28%, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, -4.1px) rotate(6deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(66% 0px, 84% 6%, 49% 10%, 61% 23%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, -4.1px) rotate(6deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(66% 0px, 84% 6%, 49% 10%, 61% 28%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, -3.1px) rotate(3deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(66% 0px, 70% 3%, 49% 10%, 65% 30%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, -3.1px) rotate(1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(66% 0px, 84% 6%, 49% 10%, 61% 23%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(20px, -3.1px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(66% 0px, 84% 6%, 49% 10%, 74% 29%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, -2.1px) rotate(1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(66% 0px, 84% 6%, 49% 3%, 61% 23%, 94% 26%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 3% 0px)"
                      : "";

                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate3d(14px, 19px, 0px) rotate(4deg)"
                      : size === "small"
                      ? "translate3d(22px, 38px, 0px) rotate(0deg)"
                      : "translate3d(16.5px, 21px, 0px) rotate(4deg)";

                  width =
                    size === "large"
                      ? "54px"
                      : size === "small"
                      ? "54px"
                      : "45px";

                  break;
              }
              break;
            case "SIMPLE_HOOP":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, -11px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 84% -1px, 42% 20%, 63% 43%, 91% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 29% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -10px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1px, 67% 0px, 37% 13%, 80% 36%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(16px, -12px) rotate(0deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 88% 0px, 36% 24%, 101% 28%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(14px, -10px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -10px) rotate(12deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% -4px, 19% 13%, 86% 16%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -10px) rotate(12deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% -4px, 19% 13%, 86% 16%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(18px, -11px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 75% 0px, 47% 27%, 101% 21%, 97% 28%, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(18px, -11px) rotate(6deg)"
                      : "translate(8px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 75% 0px, 47% 27%, 101% 21%, 97% 28%, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, -10px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "26px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, -10px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "26px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, -10px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, -10px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, -11px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 71% 0px, 37% 13%, 72% 16%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, -11px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate3d(10px, 33px, 0px) rotate(-9deg)"
                      : size === "small"
                      ? "translate3d(10px, 33px, 0px) rotate(-9deg)"
                      : "translate3d(13px, 34px, 0px) rotate(-12deg)";

                  width =
                    size === "large"
                      ? "46px"
                      : size === "small"
                      ? "48px"
                      : "54px";
                  break;
              }
              break;

            case "STUD":
              transform =
                size === "large"
                  ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                  : size === "small"
                  ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                  : "translate3d(17px, 19px, 0px) rotate(22deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(15px, -3px, 0px) rotate(143deg)"
                  : size === "small"
                  ? "translate3d(18px, 10px, 0px) rotate(161deg)"
                  : "translate3d(18px, 10px, 0px) rotate(161deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "27px" : "28px";
              break;
            case "TWISTED_GOLD":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(8px, -7px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 84% -1px, 42% 20%, 63% 43%, 91% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 29% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, -5px) rotate(0deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 1px, 67% 0px, 37% 13%, 80% 36%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -6px) rotate(0deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 64% 0px, 29% 26%, 101% 28%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 37% 26%, 83% 23%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -5px) rotate(17deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% -4px, 19% 13%, 100% 29%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -5px) rotate(17deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% -4px, 19% 13%, 100% 29%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -7px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 53% 43%, 101% 21%, 97% 28%, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -7px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 53% 43%, 101% 21%, 97% 28%, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -6px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "26px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -6px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "26px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 30%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, -5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 37% 26%, 83% 23%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 30%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, -7px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 71% 0px, 37% 13%, 72% 22%, 86% 21%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -5px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 63% 0, 37% 13%, 68% 21%, 86% 21%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate3d(11px, 13px, 0px) rotate(21deg)"
                      : size === "small"
                      ? "translate3d(5px, 7px, 0px)rotate(4deg)"
                      : "translate3d(21px, 2px, 0px)";

                  width =
                    size === "large"
                      ? "40px"
                      : size === "small"
                      ? "22px"
                      : "28px";
                  break;
              }
              break;

            default:
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, -9px) rotate(1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "18px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 20% 4%, 29% 24%, 66% 21%, 60% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(12px, -8px) rotate(1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "28px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 35% 0, 39% 23%, 61% 17%, 58% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(19px, -8px) rotate(1deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "14px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 10% 2%, 33% 30%, 72% 25%, 69% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(12px, -8px) rotate(1deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "28px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? " polygon(0 0, 35% 0, 39% 23%, 61% 17%, 58% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                    : "";
                
                  break;
                case "SHOOTING":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(12px, -11px) rotate(15deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "28px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "  polygon(20% 0, 24% 14%, 41% 12%, 45% 0, 100% 0, 100% 26%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 0)"
                    : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(14px, -8px) rotate(8deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "28px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(20% 0px, 24% 16%, 41% 12%, 45% 0px, 100% 0px, 100% 26%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 0px)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(20px, -9px) rotate(1deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "14px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 10% 2%, 25% 27%, 69% 29%, 66% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(7px, -7px) rotate(0deg)"
                    : size === "small"
                    ? "translate(19px, -9px) rotate(2deg)"
                    : "translate(7px, -7px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "14px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 10% 2%, 30% 27%, 69% 29%, 66% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, -8.5px) rotate(6deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 8% 10%, 28% 11%, 65% 21%, 60% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(7px, -7px) rotate(0deg)"
                    : size === "small"
                    ? "translate(12px, -8.5px) rotate(6deg)"
                    : "translate(7px, -7px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 35% 0px, 39% 23%, 64% 22%, 62% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(12px, -8px) rotate(1deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "28px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 33% 0px, 39% 19%, 61% 20%, 61% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                    : "";
                
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(12px, -8px) rotate(1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "28px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 34% 0px, 39% 23%, 61% 17%, 60% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                  size === "large"
                    ? "translate(7px, -7px) rotate(0deg)"
                    : size === "small"
                    ? "translate(19px, -8px) rotate(1deg)"
                    : "translate(7px, -7px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "14px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 18% 17%, 50% 23%, 63% 14%, 65% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                    : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(12px, -8px) rotate(1deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "28px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 27% 0px, 51% 28%, 61% 17%, 60% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                    : "";
                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate(24px, 9px) rotate(75deg)"
                      : size === "small"
                      ? "translate(24px, 6px) rotate(75deg)"
                      : "translate(24px, 9px) rotate(75deg)";

                  width =
                    size === "large"
                      ? "33px"
                      : size === "small"
                      ? "28px"
                      : "33px";
                  // clipPath =
                  // size === "small" ? "polygon(0 31%, 0 17%, 0 0, 97% 0, 59% 0, 43% 35%, 100% 38%, 100% 60%, 100% 100%, 0 99%, 0 76%, 0 56%)" :""
                  break;
              }
              break;
          }
          break;
        case "DotB":
          switch (earringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate3d(14px, -4px, 0px) rotate(-126deg)"
                  : size === "small"
                  ? "translate(24px, 13px) rotate(1deg)"
                  : "translate(15px, 13px) rotate(104deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "30px" : "28px";
              break;
            case "DIAMONDCRAWLER":
              transform =
                size === "large"
                  ? "translate(24px, 13px) rotate(184deg)"
                  : size === "small"
                  ? "translate(24px, 13px) rotate(184deg)"
                  : "translate(24px, 13px) rotate(184deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "30px" : "28px";
              break;
            case "DIAMOND_CRAWLER":
              transform =
                size === "large"
                  ? "translate(24px, 10px) rotate(-69deg)"
                  : size === "small"
                  ? "translate(24px, 10px) rotate(-69deg)"
                  : "translate(24px, 10px) rotate(-69deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "30px" : "28px";
              break;
            case "KNIFE_EDGED":
              transform =
                size === "large"
                  ? "translate3d(-23px, 0px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 12px, 0px)"
                  : "translate3d(-16px, 5px, 0px)";
              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "MODERN_COLOUR":
              transform =
                size === "large"
                  ? "translate3d(4px, -16px, 0px) rotate(-7deg)"
                  : size === "small"
                  ? "translate3d(4px, -16px, 0px) rotate(-7deg)"
                  : "translate3d(4px, -16px, 0px) rotate(-7deg)";

              width =
                size === "large" ? "34px" : size === "small" ? "34px" : "38px";
              break;
            case "BRUSHED":
              transform =
                size === "large"
                  ? "translate3d(34px, 9px, 0px) rotate(13deg)"
                  : size === "small"
                  ? "translate3d(34px, 9px, 0px) rotate(13deg)"
                  : "translate3d(34px, 9px, 0px) rotate(13deg)";

              width =
                size === "large" ? "36px" : size === "small" ? "22px" : "32px";
              break;
            case "SIMPLE_HOOP":
              transform =
                size === "large"
                  ? "translate3d(-20px, 6px, 0px)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "STUDSTAR":
              transform =
                size === "large"
                  ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                  : size === "small"
                  ? "translate3d(8px, 17px, 0px) rotate(29deg)"
                  : "translate3d(17px, 19px, 0px) rotate(22deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDLIGHTNING":
              transform =
                size === "large"
                  ? "translate3d(23px, 7px, 0px) rotate(-56deg)"
                  : size === "small"
                  ? "translate3d(23px, 7px, 0px) rotate(-56deg)"
                  : "translate3d(23px, 7px, 0px) rotate(-56deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDMINI":
              transform =
                size === "large"
                  ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                  : size === "small"
                  ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                  : "translate3d(17px, 19px, 0px) rotate(22deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "30px" : "30px";
              break;
            case "STUDMOON":
              transform =
                size === "large"
                  ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                  : size === "small"
                  ? "translate3d(11px, 9px, 0px) rotate(184deg)"
                  : "translate3d(17px, 19px, 0px) rotate(22deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(15px, -8px, 0px) rotate(121deg)"
                  : size === "small"
                  ? "translate3d(11px, -3px, 0px) rotate(147deg)"
                  : "translate3d(15px, -8px, 0px) rotate(121deg)";
              width =
                size === "large" ? "25px" : size === "small" ? "30px" : "28px";
              break;
            case "Constellation":
              transform =
                size === "large"
                  ? "translate3d(15px, -3px, 0px) rotate(143deg)"
                  : size === "small"
                  ? "translate3d(17px, -3px, 0px) rotate(307deg)"
                  : "translate3d(18px, 10px, 0px) rotate(161deg)";
              width =
                size === "large" ? "23px" : size === "small" ? "21px" : "22px";
              break;
            case "Star_Chain":
              transform =
                size === "large"
                  ? "translate3d(12px, 1px, 0px) rotate(-34deg)"
                  : size === "small"
                  ? "translate3d(12px, 1px, 0px) rotate(-34deg)"
                  : "translate3d(12px, 1px, 0px) rotate(-34deg)";
              width =
                size === "large" ? "23px" : size === "small" ? "21px" : "22px";
              break;
            case "TWISTED_GOLD":
              transform =
                size === "large"
                  ? "translate3d(21px, 3px, 0px)"
                  : size === "small"
                  ? "translate3d(21px, 3px, 0px)"
                  : "translate3d(21px, 2px, 0px)";

              width =
                size === "large" ? "38px" : size === "small" ? "22px" : "28px";
              break;
            default:
              transform =
                size === "large"
                  ? "translate(27px, -6px) rotate(74deg)"
                  : size === "small"
                  ? "translate(26px, -7px) rotate(71deg)"
                  : "translate(26px, -10px) rotate(71deg)";

              width =
                size === "large" ? "35px" : size === "small" ? "25px" : "30px";
              break;
          }
          break;
        case "E":
        case "E1":
          switch (circleEarringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(16px, 16px) rotate(52deg)"
                  : size === "small"
                  ? "translate(16px, 16px) rotate(52deg)"
                  : "translate(16px, 16px) rotate(52deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "27px" : "28px";
              break;
            case "KNIFE_EDGED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(15px, 5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 14% 23%, 39% 34%, 62% 13%, 41% 0, 100% 0, 100% 41%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(14px, 5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 14% 17px, 53% 16%, 33% -13%, 93% 24%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 5px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 8% 16%, 36% 24%, 67% 11%, 38% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 8px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 12% 16px, 35% 23%, 64% -5%, 88% 24%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(18px, 6px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 15%, -32% 22%, 41% 19%, 15% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(18px, 6px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 15%, -32% 22%, 41% 19%, 15% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 0px 16%, 42% 25%, 76% 14%, 37% 1%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(20px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 0px 16%, 42% 24%, 84% 23%, 33% 2%, 97% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, 6px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -21px 36%, 75% 20%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, 6px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -21px 36%, 75% 20%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 8px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 12% 16px, 35% 23%, 64% -5%, 88% 24%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, 6px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 20%, 56% 25%, 37% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(19px, 6.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 23%, 0px 34%, 53% 17%, 51% 9%, 37% 0px, 100% 0px, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(16px, 6.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 12%, 56% 23%, 34% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(11px, 30px, 0px) rotate(-16deg)"
                      : size === "small"
                      ? "translate3d(11px, 30px, 0px) rotate(-16deg)"
                      : "translate3d(11px, 30px, 0px) rotate(-16deg)";
                  width =
                    size === "large"
                      ? "42px"
                      : size === "small"
                      ? "36px"
                      : "37px";
                  break;
              }
              break;

            case "MODERN_COLOUR":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 3px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, -65% 33%, 46% 30%, -8% -86%, 65% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(9px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "27px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 2px, -5% 39%, 61% 30%, 62% 13%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(12px, 4px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4% 0, 9% 14%, 32% 24%, 67% 11%, 51% 1%, 98% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, 3.5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0%, -7px 5px, 56% 20%, 51% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 3px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 3% 17%, 41% 19%, 15% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 3px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 37%, 2% 16%, 45% 20%, 28% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(14px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 0 17%, 25% 23%, 65% 10%, 36% 1%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(14px, 3px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 0px 17%, 25% 23%, 60% 8%, 21% 1%, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 4px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -22px 20%, 61% 19%, 46% -1px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 4px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -22px 62%, 61% 19%, 46% -1px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, 3.5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0%, -7px 5px, 56% 20%, 51% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 3px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 12%, 45% 24%, 42% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -3.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 23%, 0px 21%, 43% 17%, 62% 4%, 37% 0px, 100% 0px, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, 2.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 18%, -8px 23%, 56% 20%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(9px, 24px, 0px) rotate(8deg)"
                      : size === "small"
                      ? "translate3d(9px, 24px, 0px) rotate(8deg)"
                      : "translate3d(13px, 24px, 0px) rotate(-11deg)";

                  width =
                    size === "large"
                      ? "34px"
                      : size === "small"
                      ? "28px"
                      : "31px";
                  break;
                  //   transform =
                  //   size === "large"
                  //     ? "translate3d(6px, -0.5px, 6px) rotate(368deg)"
                  //     : size === "small"
                  //     ? "translate3d(1px, 8.5px, 6px) rotate(366deg)"
                  //     : "translate3d(6px, -0.5px, 6px) rotate(368deg)";

                  // width =
                  //   size === "large" ? "44px" : size === "small" ? "40px" : "43px";
                  // // polygone =
                  // //   size === "large"
                  // //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 70.37% 85.29%, 148% 115%, 27% 115%, 1% 87%, 8% 82%, -24px 56%, 6px 0px)"
                  // //     : size === "small"
                  // //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 84.37% 95.29%, 47% 87%, 2% 98%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)"
                  // //     : "polygon(157% 9px, 91.98% 23.55%, 38.91% 29.77%, 71.37% 91.29%, 115% 100%, 14% 100%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)";
                  break;
              }
              break;

            case "BRUSHED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(14px, 6px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(2% 0, 16% 10%, 33% 24%, 63% 11%, 47% 0, 99% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 99%, 0 49%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(11px, 6px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "25px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 19% 9%, 39% 26%, 141% -122%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, 7px) rotate(1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "18px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 6% 10%, 36% 19%, 64% 9%, 45% 0, 100% 1%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 7px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "25px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0%, 9.5px 6px, 56% 23%, 49% -65px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 5px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, 4% 13%, 41% 19%, 24% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 5px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 37%, 2% 12%, 45% 20%, 31% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(15px, 5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 13% 9%, 57% 35%, 63% 2%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 6px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "12px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, -12% 9%, 62% 38%, 62% 6%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 5px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 6px 13%, 61% 21%, 53% 1px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 5px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 6px 13%, 61% 26%, 53% 1px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 7px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "25px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0%, 9px 6px, 56% 23%, 49% -65px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 9%, 56% 23%, 34% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 23%, 0 10%, 43% 17%, 51% 9%, 37% 0, 100% 0, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 5.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 18%, -8px 15%, 63% 22%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(13px, 31px, 0px)"
                      : size === "small"
                      ? "translate3d(12px, 30px, 0px)"
                      : "translate3d(12px, 30px, 0px)";

                  width =
                    size === "large"
                      ? "34px"
                      : size === "small"
                      ? "22px"
                      : "32px";
                  break;
              }
              break;

            case "SIMPLE_HOOP":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(15px, -4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 4% 9%, 54% 30%, 62% 13%, 34% 0, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(15px, -4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 2px, -5% 39%, 61% 30%, 62% 13%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, -6px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 4% 9%, 54% 30%, 62% 13%, 34% 0, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -5px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -7px 5px, 56% 19%, 40% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -6px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 3% 17%, 41% 19%, 15% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -6px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 37%, 2% 16%, 45% 20%, 28% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, -5px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 4% 9%, 54% 30%, 62% 13%, 34% 0, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(8px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -5px) rotate(2deg)"
                      : "translate(17px, -4px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 25%, 5% 7px, 27% 19%, 73% 11%, 6% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, -6px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -22px 20%, 61% 20%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, -6px) rotate(4deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(51% 0px, 87% -15px, 99% 42%, 97% 71%, 88% 94%, 58% 100%, 26% 97%, -4% 75%, 10% 3px, 66% 29%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -4.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 29%, -8px 22%, 63% 21%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 2px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 12%, 56% 23%, 34% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, -5.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 23%, 0 10%, 43% 17%, 51% 9%, 37% 0, 100% 0, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, -5.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 18%, -8px 17%, 62% 22%, 41% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(14px, 27px, 0px) rotate(-7deg)"
                      : size === "small"
                      ? "translate3d(14px, 27px, 0px) rotate(-7deg)"
                      : "translate3d(17px, 27px, 0px) rotate(-26deg)";

                  width =
                    size === "large"
                      ? "27px"
                      : size === "small"
                      ? "21px"
                      : "24px";
                  break;
              }
              break;

            case "STUD":
              transform =
                size === "large"
                  ? "translate3d(15px, 21px, 0px) rotate(19deg)"
                  : size === "small"
                  ? "translate3d(15px, 21px, 0px) rotate(19deg)"
                  : "translate3d(15px, 21px, 0px) rotate(19deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(16px, 4px, 0px) rotate(202deg)"
                  : size === "small"
                  ? "translate3d(14px, 14px, 0px) rotate(225deg)"
                  : "translate3d(14px, 14px, 0px) rotate(225deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "27px" : "28px";
              break;
            case "TWISTED_GOLD":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, 2px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 40% 0, 32% 16%, 62% 39%, 91% 25%, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, 2px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 40% 0, 32% 16%, 62% 39%, 91% 25%, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(16px, 3px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 40% 0, 32% 16%, 62% 39%, 91% 25%, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, 7px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 40% 0px, 16% -24%, 62% 39%, 91% 25%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(17px, 3px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 3% 17%, 41% 19%, 15% -1px, 91% 15px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(17px, 3px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 3% 17%, 41% 19%, 15% -1px, 91% 15px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(23px, 1px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 13% 5%, 57% 35%, 112% 2%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(23px, 1px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 13% 5%, 57% 35%, 112% 2%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, 1px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "22px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 13% -23%, 57% 35%, 85% 2%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, 1px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "22px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 13% -23%, 57% 35%, 85% 2%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, 7px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 40% 0px, 16% -24%, 62% 39%, 91% 25%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, 7px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 40% 0px, 16% -24%, 62% 39%, 91% 25%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 40% 0, 32% 16%, 62% 39%, 91% 25%, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 40% 0, 32% 16%, 62% 39%, 91% 25%, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : "";

                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(19px, 11px, 0px) rotate(-10deg)"
                      : size === "small"
                      ? "translate3d(20px, 11px, 0px) rotate(-16deg)"
                      : "translate3d(20px, 11px, 0px) rotate(-16deg)";

                  width =
                    size === "large"
                      ? "30px"
                      : size === "small"
                      ? "22px"
                      : "28px";
                  break;
              }
              break;

            default:
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(9px, 12px) rotate(1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "21px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 49% 0, 33% 17%, 74% 31%, 86% 18%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(7px, 9px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 35% 0px, 28% 13%, 68% 28%, 78% 1%, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 8px) rotate(1deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "25px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 37% 11%, 54% 9%, 12px 31%, 111% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, 9px) rotate(1deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 37% 11%, 54% 9%, 12px 31%, 111% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 9px) rotate(14deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 14% 9%, 40% 21%, 64% -3%, 42% 0px, 100% 3%, 100% 50%, 100% 100%, 65% 100%, 35% 101%, 0px 100%, 0px 52%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 9px) rotate(14deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 14% 9%, 40% 21%, 64% -3%, 42% 0px, 100% 3%, 100% 50%, 100% 100%, 65% 100%, 35% 101%, 0px 100%, 0px 52%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 1px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "16px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 27% 3%, 21% 20%, 74% 30%, 100% 16%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 1px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "16px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 27% 3%, 21% 20%, 74% 30%, 100% 16%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, 10px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 27%, 12px 5.5%, 66% 12%, 96% 20px, 97% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, 10px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 27%, 12px 5.5%, 66% 12%, 96% 20px, 97% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, 9px) rotate(1deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 37% 11%, 54% 9%, 12px 31%, 111% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, 8px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -11%, 38% 11%, 79% 27%, 20px -5%, 72% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 9px) rotate(1deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "25px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 37% 11%, 54% 9%, 12px 31%, 111% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, 9px) rotate(1deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 37% 11%, 54% 9%, 12px 31%, 111% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(13px, 35px, 0px) rotate(4deg)"
                      : size === "small"
                      ? "translate3d(16px, 26px, 0px) rotate(-26deg)"
                      : "translate3d(13px, 35px, 0px) rotate(4deg)";

                  width =
                    size === "large"
                      ? "28px"
                      : size === "small"
                      ? "22px"
                      : "28px";

                  break;
              }
          }
          break;
        case "DotE":
          switch (earringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(16px, 16px) rotate(52deg)"
                  : size === "small"
                  ? "translate(16px, 16px) rotate(52deg)"
                  : "translate(16px, 16px) rotate(52deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "27px" : "28px";
              break;
            case "DIAMONDCRAWLER":
              transform =
                size === "large"
                  ? "translate(17px, 13px) rotate(249deg)"
                  : size === "small"
                  ? "translate(17px, 13px) rotate(249deg)"
                  : "translate(17px, 13px) rotate(249deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "30px" : "30px";
              break;
            case "DIAMOND_CRAWLER":
              transform =
                size === "large"
                  ? "translate(19px, 19px) rotate(164deg)"
                  : size === "small"
                  ? "translate(19px, 19px) rotate(164deg)"
                  : "translate(19px, 19px) rotate(164deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "27px" : "28px";
              break;
            case "KNIFE_EDGED":
              transform =
                size === "large"
                  ? "translate3d(-23px, 0px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 12px, 0px)"
                  : "translate3d(-16px, 5px, 0px)";
              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "MODERN_COLOUR":
              transform =
                size === "large"
                  ? "translate3d(-23px, 12px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 24px, 0px)"
                  : "translate3d(0px, 37px, 0px) rotate(8deg)";

              width =
                size === "large" ? "34px" : size === "small" ? "28px" : "31px";
              break;
            case "BRUSHED":
              transform =
                size === "large"
                  ? "translate3d(1px, 42px, 0px)"
                  : size === "small"
                  ? "translate3d(4px, 42px, 0px)"
                  : "translate3d(4px, 42px, 0px)";

              width =
                size === "large" ? "36px" : size === "small" ? "22px" : "32px";
              break;
            case "SIMPLE_HOOP":
              transform =
                size === "large"
                  ? "translate3d(-20px, 6px, 0px)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "STUDSTAR":
              transform =
                size === "large"
                  ? "translate3d(16px, 21px, 0px) rotate(19deg)"
                  : size === "small"
                  ? "translate3d(15px, 23px, 0px) rotate(32deg)"
                  : "translate3d(16px, 21px, 0px) rotate(19deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDMINI":
              transform =
                size === "large"
                  ? "translate3d(19px, 24px, 0px) rotate(35deg)"
                  : size === "small"
                  ? "translate3d(19px, 24px, 0px) rotate(35deg)"
                  : "translate3d(19px, 24px, 0px) rotate(35deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "30px" : "30px";
              break;
            case "STUDMOON":
              transform =
                size === "large"
                  ? "translate3d(16px, 16px, 0px) rotate(203deg)"
                  : size === "small"
                  ? "translate3d(16px, 16px, 0px) rotate(203deg)"
                  : "translate3d(16px, 16px, 0px) rotate(203deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDLIGHTNING":
              transform =
                size === "large"
                  ? "translate3d(20px, 14px, 0px) rotate(-170deg)"
                  : size === "small"
                  ? "translate3d(20px, 14px, 0px) rotate(-170deg)"
                  : "translate3d(20px, 14px, 0px) rotate(-170deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(16px, 5px, 0px) rotate(202deg)"
                  : size === "small"
                  ? "translate3d(14px, 7px, 0px) rotate(222deg)"
                  : "translate3d(14px, 14px, 0px) rotate(225deg)";
              width =
                size === "large" ? "25px" : size === "small" ? "30px" : "28px";
              break;
            case "Constellation":
              transform =
                size === "large"
                  ? "translate3d(16px, 4px, 0px) rotate(202deg)"
                  : size === "small"
                  ? "translate3d(19px, 4px, 0px) rotate(193deg)"
                  : "translate3d(14px, 14px, 0px) rotate(225deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "21px" : "28px";
              break;
            case "Star_Chain":
              transform =
                size === "large"
                  ? "translate3d(16px, 4px, 0px) rotate(202deg)"
                  : size === "small"
                  ? "translate3d(17px, 9px, 0px) rotate(381deg)"
                  : "translate3d(14px, 14px, 0px) rotate(225deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "21px" : "28px";
              break;
            case "TWISTED_GOLD":
              transform =
                size === "large"
                  ? "translate3d(4px, 31px, 0px) rotate(-16deg)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "27px" : size === "small" ? "22px" : "28px";
              break;
            default:
              transform =
                size === "large"
                  ? "translate3d(15px, 29px, 0px) rotate(-42deg)"
                  : size === "small"
                  ? "translate3d(12px, 40px, 0px) rotate(-19deg)"
                  : "translate3d(12px, 40px, 0px) rotate(-51deg)";

              width =
                size === "large" ? "26px" : size === "small" ? "20px" : "23px";
              // polygone =
              //   size === "large"
              //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
              //     : size === "small"
              //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
              //     : "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)";

              break;
          }
          break;
        case "C":
        case "C1":
          switch (circleEarringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(12px, 20px) rotate(14deg)"
                  : size === "small"
                  ? "translate(12px, 20px) rotate(14deg)"
                  : "translate(12px, 20px) rotate(14deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "27px" : "28px";
              break;
            case "KNIFE_EDGED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(17px, 3px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 0px 13%, 49% 36%, 62% 13%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 3.5px) rotate(3deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 19% 20%, 42% 29%, 56% 10%, 36% 0, 100% 0, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(20.5px, 3px) rotate(1deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 0px 24%, 58% 27%, 62% 13%, 29% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, 2px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 19% 20%, 42% 21.5%, 56% 10%, 36% 0, 100% 0, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 5px) rotate(7deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 19% 20%, 42% 20.5%, 47% 10%, 36% 0px, 100% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 3px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 0px 15%, 58% 15%, 31% 15%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(24px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "15px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 25%, 0 20%, 32% 25%, 60% 8%, 24% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(14px, 5px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 19% 20%, 42% 21.5%, 56% 10%, 36% 0, 100% 0, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "25px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 0px 15%, 58% 27%, 62% 13%, 34% 0px, 96% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 54%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 4px) rotate(2deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 26% 16%, 49% 24%, 58% 8%, 44% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 5px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -11%, 28% 19%, 58% 13%, 14px -5%, 72% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(14px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 24% 16%, 45% 20%, 56% 8%, 39% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 44%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, 3px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 20% 11%, 47% 18%, 59% 9%, 35% 0px, 98% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "37px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -11%, 38% 19%, 50% 8%, 16px -5%, 72% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(11px, 12px, 0px)"
                      : size === "small"
                      ? "translate3d(11px, 12px, 0px)"
                      : "translate3d(-1px, 43px, 0px) rotate(9deg)";
                  width =
                    size === "large"
                      ? "32px"
                      : size === "small"
                      ? "22px"
                      : "54px";
                  break;
              }
              break;
            case "MODERN_COLOUR":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(8px, 0px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 12% 16%, 29% 26%, 53% 10%, 32% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, 1px) rotate(3deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 15% 16%, 40% 31%, 56% 21%, 39% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 0px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "20px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 15% 17%, 39% 31%, 57% 14%, 37% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, 2px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 15% 19%, 1% 17%, 55% 20%, 43% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 1px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 14% 15%, 38% 20%, 48% 13%, 28% 0px, 100% 3%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(9px, 1px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 14% 15%, 38% 20%, 48% 13%, 28% 0px, 100% 3%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -1px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "16px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(2% 0px, 0px 13%, 19% 22%, 61% 16%, 32% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(10px, -1px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "16px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(2% 0px, 0px 13%, 22% 22%, 61% 16%, 32% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, 1px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 27%, 5px 13%, 63% 16%, 53% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(0px, -1px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 30% 13%, 46% 25%, 59% 8%, 48% 0, 100% 0, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(4px, 2px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "35px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 15% 19%, 1% 17%, 55% 20%, 43% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, 1px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -11%, 38% 20%, 54% 8%, 14px -5%, 72% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 1px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "25px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0px, 18% 16%, 41% 21%, 57% 5%, 35% 0px, 99% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, 2px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 15% 19%, 1% 17%, 55% 20%, 43% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(0px, 29px, 0px) rotate(4deg)"
                      : size === "small"
                      ? "translate3d(5px, 29px, 0px) rotate(1deg)"
                      : "translate3d(5px, 29px, 0px) rotate(1deg)";

                  width =
                    size === "large"
                      ? "34px"
                      : size === "small"
                      ? "22px"
                      : "38px";
                  break;
              }
              break;
            case "BRUSHED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, 4px) rotate(0deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 34% 24%, 58% 10%, 12px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 5px) rotate(5deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 34% 27%, 58% 10%, 12px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, 5px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "20px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 16% 0, 33% 18%, 66% 10%, 57% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 20% 9%, 41% 20%, 59% 11%, 52% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, 4px) rotate(17deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(1% 0, 1% 12%, 24% 18%, 40% 7%, 22% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 12% 9%, 35% 19%, 52% 12%, 44% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 44%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "16px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "  polygon(6% 0, 6% 2%, 28% 20%, 71% 13%, 57% 0, 100% 1%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "16px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 9% 3%, 28% 20%, 71% 13%, 57% 0, 100% 1%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 5px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 18%, 1px 14%, 68% 16%, 56% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 5px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 25% 11%, 48% 25%, 59% 10%, 51% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(6px, 4px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 20% 9%, 41% 20%, 59% 11%, 52% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(7px, 4.5px) rotate(3deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "28px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 25% 11%, 48% 25%, 59% 10%, 51% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 5px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "25px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 33% 15%, 51% 10%, 12px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(7px, 5px) rotate(3deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "27px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 25% 11%, 48% 25%, 59% 10%, 51% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                    : "";
                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(-2px, 42px, 0px) rotate(14deg)"
                      : size === "small"
                      ? "translate3d(-2px, 45px, 0px) rotate(14deg)"
                      : "translate3d(-2px, 45px, 0px) rotate(52deg)";

                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "22px"
                      : "48px";
                  break;
              }
              break;
            case "SIMPLE_HOOP":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(4px, 3px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 36% 34%, 62% 15%, 8px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(2px, 3px) rotate(4deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 41% 34%, 42% 9%, 12px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "18px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 23% 12%, 67% 15%, 8px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, 4px) rotate(0deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -11%, 26% 14%, 58% 13%, 11px -5%, 72% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, 4px) rotate(19deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 8% 15%, 28% 18%, 34% 9%, 1% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(0px, 3px) rotate(19deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 7% 18%, 30% 18%, 34% 9%, 1% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "16px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -4%, 38% 29%, 56% 14%, 5px -4%, 73% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform = 
                  size === "large"
                  ? "translate(5px, -6px) rotate(0deg)"
                  : size === "small"
                  ? "translate(7px, 4px) rotate(2deg)"
                  : "translate(5px, -6px) rotate(0deg)";
              width =
                size === "large"
                  ? "24px"
                  : size === "small"
                  ? "16px"
                  : "23px";
              clipPath =
                size === "large"
                  ? ""
                  : size === "small"
                  ? "polygon(0px -4%, 38% 29%, 56% 14%, 5px -4%, 73% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                  : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(1px, 4px) rotate(11deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 18%, 1px 18%, 68% 16%, 39% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(1px, 4px) rotate(11deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(4px 18%, -5px 26%, 68% 16%, 39% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(1px, 4px) rotate(0deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px -11%, 26% 14%, 58% 13%, 11px -5%, 72% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "25px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 28% 21%, 62% 15%, 8px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "25px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 30% 13%, 51% 10%, 11px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, 4px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "27px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px -13%, 28% 24%, 62% 15%, 8px 1%, 62% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                default:
                  transform =
                    size === "large"
                      ? "translate3d(3px, 11px, 0px) rotate(2deg)"
                      : size === "small"
                      ? "translate3d(3px, 11px, 0px) rotate(2deg)"
                      : "translate3d(-8px, 36px, 0px) rotate(10deg)";

                  width =
                    size === "large"
                      ? "34px"
                      : size === "small"
                      ? "37px"
                      : "40px";
                  break;
              }
              break;
            case "STUD":
              transform =
                size === "large"
                  ? "translate3d(12px, 28px, 0px) rotate(44deg)"
                  : size === "small"
                  ? "translate3d(12px, 28px, 0px) rotate(44deg)"
                  : "translate3d(12px, 28px, 0px) rotate(44deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(16px, 7px, 0px) rotate(-111deg)"
                  : size === "small"
                  ? "translate3d(16px, 7px, 0px) rotate(-111deg)"
                  : "translate3d(16px, 7px, 0px) rotate(-111deg)";
              width =
                size === "large" ? "31px" : size === "small" ? "31px" : "31px";
              break;
            case "TWISTED_GOLD":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(18px, -1px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "21px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 23% 4%, 29% 24%, 64% 16%, 52% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -3px) rotate(3deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 25% 5%, 41% 22%, 59% 13%, 51% 0, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(19px, -1px) rotate(1deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "20px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 20% 9%, 39% 19%, 61% 9%, 49% 0, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, -2px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 20% 9%, 51% 15%, 61% 9%, 49% 0px, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, -3px) rotate(15deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 14% 15%, 40% 19%, 30.5% -3%, 42% 0px, 100% 3%, 100% 50%, 100% 100%, 65% 100%, 35% 101%, 0px 100%, 0px 52%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(11px, -3px) rotate(15deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 14% 13%, 40% 18%, 40.5% -3%, 42% 0px, 100% 3%, 100% 50%, 100% 100%, 65% 100%, 35% 101%, 0px 100%, 0px 52%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(20px, -3px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "16px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 11% 11%, 27% 25%, 62% 9%, 49% 0px, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(20px, -3px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "16px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 15% 9%, 30% 27%, 62% 9%, 49% 0px, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, 0px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 27%, 10px 6%, 68% 16%, 58% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, 0px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "32px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(4px 27%, 10px 6%, 68% 16%, 58% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(11px, -2px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 20% 9%, 51% 15%, 61% 9%, 49% 0px, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -0.5px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(1% 0, 32% 0, 41% 18%, 59% 8%, 53% 0, 99% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 45%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, -2px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "25px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 24% 5%, 41% 18%, 63% 10%, 52% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, -1px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 29% 4%, 44% 14%, 58% 10%, 53% 0, 98% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)"
                      : "";
                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(-2px, 42px, 0px) rotate(214deg)"
                      : size === "small"
                      ? "translate3d(-13px, 21px, 0px)"
                      : "translate3d(-14px, 11px, 0px)";

                  width =
                    size === "large"
                      ? "55px"
                      : size === "small"
                      ? "22px"
                      : "28px";
                  break;
              }
              break;
            default:
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(19px, -1px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "21px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? "polygon(1% 0, 0 25%, 43% 39%, 67% 17%, 49% 1%, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)"
                      : size === "small"
                      ? "polygon(0px 0px, 33% 0px, 33% 21%, 63% 34%, 89% 30%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 45%)"
                      : "polygon(1% 0, 0 25%, 43% 39%, 67% 17%, 49% 1%, 96% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 54%)";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(16px, 0px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "30px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 34% 0px, 37% 21%, 63% 30%, 89% 30%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 45%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, -1px) rotate(1deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "25px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(43% 0, 0 0, 0 49%, 0 79%, 0 96%, 49% 100%, 80% 100%, 100% 100%, 100% 0, 93% 14%, 61% 25%, 45% 10%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(16px, 0px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 35% 3px, 37% 21%, 63% 22%, 89% 30%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 45%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(14px, 2px) rotate(10deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "   polygon(0 0, 29% 0, 25% 6%, 38% 18%, 100% 0, 100% 28%, 99% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 0px) rotate(10deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 29% 2px, 32% 4%, 47% 23%, 100% 0px, 100% 28%, 99% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(21px, 0px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "15px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(3% 0, 36% 0, 25% 14%, 72% 27%, 100% 21%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(21px, -1px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "15px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(3% 0, 36% 0, 25% 14%, 72% 27%, 100% 21%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 0px) rotate(4deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(2% 0, 46% 0, 43% 9%, 61% 23%, 86% 15%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(12px, 0px) rotate(4deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(2% 0, 46% 0, 43% 9%, 61% 27%, 86% 15%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 46%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(-65px, 44px) rotate(64deg)"
                    : size === "small"
                    ? "translate(16px, 0px) rotate(2deg)"
                    : "translate(-65px, 44px) rotate(64deg)";
                width =
                  size === "large"
                    ? "50px"
                    : size === "small"
                    ? "30px"
                    : "40px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 35% 3px, 37% 21%, 63% 22%, 89% 30%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 45%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 0px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 39% 0, 39% 13%, 55% 21%, 76% 15%, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(15px, 0px) rotate(1deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "25px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 45% 0px, 38% 18%, 51% 23%, 80% 22%, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                    : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(12px, 0px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "35px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 39% 0px, 39% 13%, 55% 23%, 76% 15%, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;

                default:
                  transform =
                    size === "large"
                      ? "translate3d(5px, 25px, 0px) rotate(2deg)"
                      : size === "small"
                      ? "translate3d(12px, 27px, 0px) rotate(158deg)"
                      : "translate3d(4px, 31px, 0px) rotate(10deg)";

                  width =
                    size === "large"
                      ? "48px"
                      : size === "small"
                      ? "27px"
                      : "45px";
                  clipPath =
                    size === "small"
                      ? "polygon(0 24%, 0 0, 35% 0%, 100% 0, 88% 19%, 45% 34%, 54% 49%, 87% 47%, 70% 81%, 100% 73%, 100% 100%, 0 100%)"
                      : "";
                  break;
              }
              break;
          }
          break;
        case "DotC":
          switch (earringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(12px, 20px) rotate(57deg)"
                  : size === "small"
                  ? "translate(12px, 20px) rotate(57deg)"
                  : "translate(12px, 20px) rotate(57deg)";
              width =
                size === "large" ? "36px" : size === "small" ? "31px" : "33px";
              break;
            case "DIAMONDCRAWLER":
              transform =
                size === "large"
                  ? "translate(12px, 17px) rotate(-83deg)"
                  : size === "small"
                  ? "translate(12px, 17px) rotate(-83deg)"
                  : "translate(12px, 17px) rotate(-83deg)";
              width =
                size === "large" ? "36px" : size === "small" ? "31px" : "33px";
              break;
            case "DIAMOND_CRAWLER":
              transform =
                size === "large"
                  ? "translate(12px, 20px) rotate(15deg)"
                  : size === "small"
                  ? "translate(12px, 20px) rotate(15deg)"
                  : "translate(12px, 20px) rotate(15deg)";
              width =
                size === "large" ? "36px" : size === "small" ? "31px" : "33px";
              break;
            case "KNIFE_EDGED":
              transform =
                size === "large"
                  ? "translate3d(-23px, 0px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 12px, 0px)"
                  : "translate3d(-16px, 5px, 0px)";
              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "MODERN_COLOUR":
              transform =
                size === "large"
                  ? "translate3d(-23px, 12px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 24px, 0px)"
                  : "translate3d(15px, 22px, 0px) rotate(1deg)";

              width =
                size === "large" ? "34px" : size === "small" ? "22px" : "38px";
              break;
            case "BRUSHED":
              transform =
                size === "large"
                  ? "translate3d(25px, 11px, 0px) rotate(54deg)"
                  : size === "small"
                  ? "translate3d(27px, 12px, 0px) rotate(59deg)"
                  : "translate3d(27px, 12px, 0px) rotate(59deg)";

              width =
                size === "large" ? "36px" : size === "small" ? "22px" : "32px";
              break;
            case "SIMPLE_HOOP":
              transform =
                size === "large"
                  ? "translate3d(-20px, 6px, 0px)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              break;
            case "STUDSTAR":
              transform =
                size === "large"
                  ? "translate3d(12px, 28px, 0px) rotate(44deg)"
                  : size === "small"
                  ? "translate3d(12px, 28px, 0px) rotate(44deg)"
                  : "translate3d(12px, 28px, 0px) rotate(44deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDLIGHTNING":
              transform =
                size === "large"
                  ? "translate3d(12px, 13px, 0px) rotate(25deg)"
                  : size === "small"
                  ? "translate3d(12px, 13px, 0px) rotate(25deg)"
                  : "translate3d(12px, 13px, 0px) rotate(25deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDMINI":
              transform =
                size === "large"
                  ? "translate3d(12px, 19px, 0px) rotate(44deg)"
                  : size === "small"
                  ? "translate3d(12px, 19px, 0px) rotate(44deg)"
                  : "translate3d(12px, 19px, 0px) rotate(44deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "30px" : "30px";
              break;
            case "STUDMOON":
              transform =
                size === "large"
                  ? "translate3d(12px, 28px, 0px) rotate(44deg)"
                  : size === "small"
                  ? "translate3d(15px, 16px, 0px) rotate(212deg)"
                  : "translate3d(12px, 28px, 0px) rotate(44deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(16px, 1px, 0px) rotate(222deg)"
                  : size === "small"
                  ? "translate3d(9px, 7px, 0px) rotate(253deg)"
                  : "translate3d(16px, 7px, 0px) rotate(-111deg)";
              width =
                size === "large" ? "27px" : size === "small" ? "30px" : "31px";
              break;
            case "Constellation":
              transform =
                size === "large"
                  ? "translate3d(16px, 7px, 0px) rotate(-111deg)"
                  : size === "small"
                  ? "translate3d(16px, 7px, 0px) rotate(220deg)"
                  : "translate3d(16px, 7px, 0px) rotate(-111deg)";
              width =
                size === "large" ? "32px" : size === "small" ? "21px" : "31px";
              break;
            case "Star_Chain":
              transform =
                size === "large"
                  ? "translate3d(15px, 5px, 0px) rotate(54deg)"
                  : size === "small"
                  ? "translate3d(15px, 5px, 0px) rotate(54deg)"
                  : "translate3d(15px, 5px, 0px) rotate(54deg)";
              width =
                size === "large" ? "32px" : size === "small" ? "21px" : "31px";
              break;
            case "TWISTED_GOLD":
              transform =
                size === "large"
                  ? "translate3d(16px, 1px, 0px) rotate(195deg)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "52px" : size === "small" ? "22px" : "28px";
              break;
            default:
              transform =
                size === "large"
                  ? "translate3d(20px, 5px, 0px) rotate(126deg)"
                  : size === "small"
                  ? "translate3d(29px, 5px, 0px) rotate(126deg)"
                  : "translate3d(27px, 3px, 0px) rotate(126deg)";

              width =
                size === "large" ? "35px" : size === "small" ? "25px" : "30px";
              break;
          }
          break;
        case "F":
          case "F1" :
          switch (circleEarringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(10px, 14px) rotate(86deg)"
                  : size === "small"
                  ? "translate(10px, 14px) rotate(86deg)"
                  : "translate(10px, 14px) rotate(86deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "27px" : "28px";
              break;
            case "KNIFE_EDGED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(12px, 11px) rotate(5deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 13% 0px, 29% 26%, 66% 15%, 52% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, 10px) rotate(0deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 34% 0, 40% 23%, 59% 23%, 66% 0, 100% 1%, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 43%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(14px, 9.9px) rotate(0deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 27%, 14% 3px, 38% 28%, 60% 15%, 62% 0px, 91% 0px, 97% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, 10px) rotate(0deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 34% 0, 40% 23%, 59% 23%, 66% 0, 100% 1%, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 43%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 12px) rotate(11deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "35px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 5% 0px, 23% 15%, 34% 16%, 43% -7px, 99% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 12px) rotate(11deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "35px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 5% 0px, 23% 15%, 34% 16%, 43% -7px, 99% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 9px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 17% 0px, 37% 24%, 83% 21%, 70% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(13px, 9px) rotate(0deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "18px"
                    : size === "small"
                    ? "18px"
                    : "18px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 17% 0px, 37% 24%, 83% 21%, 70% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5.5px, 11px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 28% 1%, 46% 21%, 71% 18%, 64% 0px, 100% 0px, 100% 55%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 39%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5.5px, 11px) rotate(6deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 28% 1%, 46% 21%, 71% 18%, 64% 0px, 100% 0px, 100% 55%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 39%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5px, 10px) rotate(0deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "35px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? " polygon(0 0, 34% 0, 40% 23%, 59% 23%, 66% 0, 100% 1%, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 43%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(7.5px, 11px) rotate(1deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 28% 1%, 46% 21%, 71% 7%, 67% 0px, 100% 0px, 100% 55%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 39%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 10px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 23% 0px, 41% 16%, 60% 18%, 68% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5.5px, 11px) rotate(1deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "35px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 28% 1%, 46% 21%, 63% 7%, 67% 0px, 100% 0px, 100% 55%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 39%)"
                    : "";
                  break;
                default:
                  transform =
                  size === "large"
                    ? "translate3d(6px, 4px, 0px) rotate(1deg)"
                    : size === "small"
                    ? "translate3d(6px, 4px, 0px) rotate(1deg)"
                    : "translate3d(6px, 4px, 0px) rotate(1deg)";
                width =
                  size === "large" ? "32px" : size === "small" ? "22px" : "24px";
                break;
              }
              break;
              
            case "MODERN_COLOUR":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(12px, 4px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 20%, 36% 29%, 49% 11%, 9px 1%, 66% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 5px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 23%, 48% 29%, 49% 9%, 15px 1%, 67% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, 3.9px) rotate(2deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "24px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 11% 6%, 30% 23%, 58% 11%, 42% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(7px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, 2px) rotate(0deg)"
                      : "translate(7px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 24%, -3px 8px, 56% 17%, 51% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 6px) rotate(16deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 3% 17%, 41% 18%, 22% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 6px) rotate(16deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 29%, 3% 22%, 41% 18%, 22% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(16px, 2px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 22%, -18% 9px, 37% 28%, 73% 16%, 11% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(16px, 2px) rotate(0deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "18px"
                    : size === "small"
                    ? "18px"
                    : "18px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 22%, -18% 9px, 53% 27%, 73% 16%, 11% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3.5px, 0px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -22px 20%, 61% 20%, 45% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3.5px, 0px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -22px 20%, 61% 20%, 45% 0px, 100% 0px, 100% 25%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(7px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5px, 2px) rotate(0deg)"
                    : "translate(7px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 24%, -3px 8px, 56% 17%, 51% 0px, 100% 1px, 100% 35%, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 26%, -4% 12%, 55% 23%, 36% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 2.5px) rotate(0deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 23%, 0px 12%, 41% 20%, 57% 8%, 44% 0px, 100% 0px, 100% 47%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(5px, -7px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 5px) rotate(0deg)"
                    : "translate(5px, -7px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "35px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 26%, -4% 12%, 55% 23%, 36% -4px, 94% -4px, 100% 26%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)"
                    : "";

                  break;

                default:
                  transform =
                  size === "large"
                    ? "translate3d(5px, 8px, 0px) rotate(5deg)"
                    : size === "small"
                    ? "translate3d(5px, 6px, 0px) rotate(5deg)"
                    : "translate3d(5px, 8px, 0px) rotate(5deg)";
  
                width =
                  size === "large" ? "34px" : size === "small" ? "22px" : "30px";
                break;
              }
              break;
             
            case "BRUSHED":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(13px, 9px) rotate(3deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 20% 6%, 31% 26%, 67% 14%, 57% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 8px) rotate(4deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? " polygon(0 0, 24% 0, 38% 26%, 61% 15%, 54% 0, 100% 0, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 53%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(14px, 8.9px) rotate(2deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, -1% 0px, 25% 15%, 68% 13%, 54% 0px, 100% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 53%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 8px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 24% 0px, 41% 22%, 61% 15%, 54% 0px, 100% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 53%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 10px) rotate(18deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 1% 8%, 42% 19%, 33% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(6px, 9px) rotate(18deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 29%, 1% 6%, 42% 19%, 43% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(15px, 9px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 25%, 7% 0, 29% 19%, 71% 17%, 60% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(15px, 9px) rotate(3deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "18px"
                    : size === "small"
                    ? "15px"
                    : "18px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 25%, 7% 0, 29% 19%, 71% 17%, 60% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, 10px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 27% 8%, 44% 19%, 66% 11%, 59% 0, 100% 0, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 10px) rotate(6deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "27px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 30% 8%, 44% 19%, 66% 11%, 59% 0, 100% 0, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(8px, 8px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 24% 0px, 41% 22%, 61% 15%, 54% 0px, 100% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 53%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(10px, 9.5px) rotate(3deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 27% 8%, 39% 19%, 62% 13%, 59% 0px, 100% 0px, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 9px) rotate(2deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(37% 4px, 58% 0px, 95% 29%, 109% 72%, 95% 64%, 55% 100%, 31% 97%, -4% 75%, 10% 3px, 66% 29%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(10px, 9.5px) rotate(3deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 27% 8%, 39% 19%, 62% 13%, 59% 0px, 100% 0px, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";

                  break;
                default:
                  transform =
                size === "large"
                  ? "translate3d(8px, 4px, 0px)"
                  : size === "small"
                  ? "translate3d(8px, -2px, 0px)"
                  : "translate3d(8px, 4px, 0px)";

              width =
                size === "large" ? "22px" : size === "small" ? "22px" : "22px";
              break;
              }
              break;
             
            case "SIMPLE_HOOP":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(12px, 6px) rotate(3deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "20px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 20% 6%, 31% 26%, 67% 20%, 45% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 6px) rotate(4deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "30px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 24% 0px, 38% 25%, 54% 22%, 47% 0px, 100% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 53%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(13px, 6.9px) rotate(2deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "20px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, -1% 0px, 29% 15%, 68% 13%, 40% 0px, 100% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 53%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(7px, 6px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 24% 0px, 42% 22%, 61% 15%, 47% 0px, 100% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 53%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 8px) rotate(18deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "30px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 1% 8%, 42% 19%, 25% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5px, 7px) rotate(17deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 29%, 1% 3%, 42% 19%, 35% 0px, 100% 0px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(14px, 7px) rotate(3deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "15px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 25%, 7% 0, 29% 19%, 71% 17%, 50% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(14px, 7px) rotate(3deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "18px"
                    : size === "small"
                    ? "15px"
                    : "18px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 25%, 7% 0, 29% 19%, 71% 17%, 50% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(6px, 5px) rotate(9deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 27% 8%, 44% 19%, 66% 11%, 50% 0px, 100% 0px, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(6px, 5px) rotate(9deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 27% 8%, 44% 22%, 66% 11%, 52% 0px, 100% 0px, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(7px, 6px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "30px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 24% 0px, 42% 22%, 61% 15%, 47% 0px, 100% 0px, 100% 54%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 53%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(7px, 5px) rotate(5deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 27% 8%, 44% 19%, 66% 11%, 50% 0px, 100% 0px, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "CELESTIAL":
                  transform =
                    size === "large"
                      ? "translate(5px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(10px, 6px) rotate(2deg)"
                      : "translate(5px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "25px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 15% 5%, 42% 18%, 65% 17%, 44% 0px, 100% 0px, 100% 48%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 46%)"
                      : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(10px, 8.5px) rotate(3deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "25px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 27% 8%, 39% 19%, 62% 13%, 49% 0px, 100% 0px, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";

                  break;
                default:
                  transform =
                  size === "large"
                    ? "translate3d(3px, 4px, 0px)"
                    : size === "small"
                    ? "translate3d(3px, 4px, 0px)"
                    : "translate3d(6px, 6px, 0px)";
  
                width =
                  size === "large" ? "16px" : size === "small" ? "18px" : "21px";
             
                break;
              }
              break;
             

            case "STUD":
              transform =
                size === "large"
                  ? "translate3d(12px, 20px, 0px) rotate(19deg)"
                  : size === "small"
                  ? "translate3d(12px, 20px, 0px) rotate(19deg)"
                  : "translate3d(12px, 20px, 0px) rotate(19deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(5px, 4px, 0px) rotate(214deg)"
                  : size === "small"
                  ? "translate3d(5px, 4px, 0px) rotate(214deg)"
                  : "translate3d(5px, 4px, 0px) rotate(214deg)";
              width =
                size === "large" ? "32px" : size === "small" ? "32px" : "32px";
              break;
            case "TWISTED_GOLD":
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(7px, 3px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 71% 0, 41% 12%, 63% 27%, 92% 10%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 47%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(4px, 3px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "35px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 56% 0px, 42% 7%, 50% 27%, 92% 10%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(9px, 2px) rotate(1deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "24px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 63% 0px, 41% 12%, 50% 27%, 92% 10%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(4px, 3px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "35px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 56% 0px, 42% 7%, 40% 17%, 92% 10%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(5px, 2px) rotate(16deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, 23% 0%, 41% 18%, 58% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5px, 2px) rotate(16deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "35px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 29%, 23% 0%, 41% 18%, 58% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 2px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 60% 0px, 50% 23%, 73% 20%, 100% 9%, 100% 39%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 45%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 2px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 60% 0px, 50% 23%, 73% 20%, 100% 9%, 100% 39%, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 45%)"
                      : "";
                  break;
                case "MARVELOUS":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(0.5px, 0px) rotate(6deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "35px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(1% 0, 60% 0, 43% 9%, 64% 19%, 100% 0, 100% 27%, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 99%, 0 49%)"
                      : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(2.5px, 0px) rotate(6deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "35px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(1% 3px, 50% 0px, 48% 9%, 64% 19%, 100% 0px, 100% 27%, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0px 99%, 0px 49%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(4px, 3px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "35px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 56% 0px, 42% 7%, 40% 17%, 92% 10%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(3.5px, 3px) rotate(1deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "35px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(1% 0, 60% 0, 43% 9%, 64% 19%, 100% 0, 100% 27%, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 99%, 0 49%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                  size === "large"
                    ? "translate(7px, -7px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5px, 2px) rotate(1deg)"
                    : "translate(7px, -7px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 63% 0px, 41% 12%, 50% 27%, 92% 10%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 47%)"
                    : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(3px, 3px) rotate(1deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "37px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(1% 0, 60% 0, 43% 9%, 64% 19%, 100% 0, 100% 27%, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 99%, 0 49%)"
                    : "";
                  break;
                default:
                  transform =
                  size === "large"
                    ? "translate3d(8px, -4px, 0px) rotate(9deg)"
                    : size === "small"
                    ? "translate3d(8px, -4px, 0px) rotate(9deg)"
                    : "translate3d(8px, -4px, 0px) rotate(9deg)";
  
                width =
                  size === "large" ? "24px" : size === "small" ? "22px" : "28px";
                break;
              }
              break;
             
            default:
              switch (earringType) {
                case "TRIODIAMOND":
                  transform =
                    size === "large"
                      ? "translate(-65px, 44px) rotate(64deg)"
                      : size === "small"
                      ? "translate(10px, 12px) rotate(2deg)"
                      : "translate(-65px, 44px) rotate(64deg)";
                  width =
                    size === "large"
                      ? "50px"
                      : size === "small"
                      ? "24px"
                      : "40px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 33% 0px, 27% 24%, 68% 34%, 76% 9%, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 53%)"
                      : "";
                  break;
                case "ENTRANCING":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, 10px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "40px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 36% 0, 39% 25%, 61% 23%, 65% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                      : "";
                  break;
                case "CROSS":
                  transform =
                    size === "large"
                      ? "translate(7px, -7px) rotate(0deg)"
                      : size === "small"
                      ? "translate(8px, 13px) rotate(1deg)"
                      : "translate(7px, -7px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "24px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 0px, 36% 0px, 39% 25%, 65% 30%, 98% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                      : "";
                  break;
                case "PEACE":
                  transform =
                    size === "large"
                      ? "translate(5px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(2px, 10px) rotate(2deg)"
                      : "translate(5px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "24px"
                      : size === "small"
                      ? "40px"
                      : "23px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 36% 0, 39% 25%, 61% 23%, 65% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                      : "";
                  break;
                case "SHOOTING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(3px, 12px) rotate(16deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "22px"
                      : size === "small"
                      ? "37px"
                      : "22px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0px 29%, -12% 0%, 44% 18%, 58% -1px, 98% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                      : "";
                  break;
                case "SHOOTINGOLD":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(0px, 12px) rotate(16deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "37px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 29%, 22% 0%, 41% 18%, 68% 2px, 96% 2px, 100% 30%, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)"
                    : "";
                  break;
                case "DARLING":
                  transform =
                    size === "large"
                      ? "translate(9px, -6px) rotate(0deg)"
                      : size === "small"
                      ? "translate(12px, 12px) rotate(0deg)"
                      : "translate(9px, -6px) rotate(0deg)";
                  width =
                    size === "large"
                      ? "18px"
                      : size === "small"
                      ? "18px"
                      : "18px";
                  clipPath =
                    size === "large"
                      ? ""
                      : size === "small"
                      ? "polygon(0 0, 33% 0, 21% 23%, 78% 27%, 91% 7%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                      : "";
                  break;
                case "PRECIOUS":
                  transform =
                  size === "large"
                    ? "translate(9px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(12px, 12px) rotate(0deg)"
                    : "translate(9px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "18px"
                    : size === "small"
                    ? "18px"
                    : "18px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 33% 0, 21% 23%, 78% 27%, 91% 7%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)"
                    : "";
                  break;
                case "MARVELOUS":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(-1px, 12px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "40px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 36% 0px, 66% 25%, 63% 23%, 75% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                case "PLANET":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(-1px, 12px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "40px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 36% 0px, 66% 25%, 63% 23%, 75% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                case "PEACESIGN":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(2px, 10px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "40px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0 0, 36% 0, 39% 25%, 61% 23%, 65% 0, 100% 0, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)"
                    : "";
                  break;
                case "HAND":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(0px, 12px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "40px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 31% 0px, 66% 25%, 63% 23%, 75% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                case "CELESTIAL":
                  transform =
                  size === "large"
                    ? "translate(7px, -7px) rotate(0deg)"
                    : size === "small"
                    ? "translate(5px, 12px) rotate(1deg)"
                    : "translate(7px, -7px) rotate(0deg)";
                width =
                  size === "large"
                    ? "22px"
                    : size === "small"
                    ? "30px"
                    : "22px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 41% 0px, 39% 25%, 65% 19%, 98% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                case "SUMMER":
                  transform =
                  size === "large"
                    ? "translate(5px, -6px) rotate(0deg)"
                    : size === "small"
                    ? "translate(0px, 13px) rotate(2deg)"
                    : "translate(5px, -6px) rotate(0deg)";
                width =
                  size === "large"
                    ? "24px"
                    : size === "small"
                    ? "40px"
                    : "23px";
                clipPath =
                  size === "large"
                    ? ""
                    : size === "small"
                    ? "polygon(0px 0px, 30% 0px, 66% 25%, 64% 23%, 74% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)"
                    : "";
                  break;
                default:
                  transform =
                  size === "large"
                    ? "translate(11px, 12px)"
                    : size === "small"
                    ? "translate(4px, 11px)"
                    : "translate(11px, 14px)";
  
                width =
                  size === "large" ? "27px" : size === "small" ? "22px" : "25px";
                break;
              }
              break;
             
          }
          break;
        case "DotF":
          switch (earringType) {
            case "CRAWLER":
              transform =
                size === "large"
                  ? "translate(3px, 8px) rotate(42deg)"
                  : size === "small"
                  ? "translate(3px, 8px) rotate(42deg)"
                  : "translate(3px, 8px) rotate(42deg)";
              width =
                size === "large" ? "36px" : size === "small" ? "32px" : "34px";
              break;
            case "DIAMONDCRAWLER":
              transform =
                size === "large"
                  ? "translate(2px, 19px) rotate(249deg)"
                  : size === "small"
                  ? "translate(2px, 19px) rotate(249deg)"
                  : "translate(2px, 19px) rotate(249deg)";
              width =
                size === "large" ? "36px" : size === "small" ? "32px" : "34px";
              break;
            case "DIAMOND_CRAWLER":
              transform =
                size === "large"
                  ? "translate(0px, 18px) rotate(169deg)"
                  : size === "small"
                  ? "translate(0px, 18px) rotate(169deg)"
                  : "translate(0px, 18px) rotate(169deg)";
              width =
                size === "large" ? "36px" : size === "small" ? "32px" : "34px";
              break;
            case "KNIFE_EDGED":
              transform =
                size === "large"
                  ? "translate3d(-23px, 0px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 12px, 0px)"
                  : "translate3d(-16px, 5px, 0px)";
              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              // polygone =
              //   size === "large"
              //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
              //     : size === "small"
              //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 84.37% 95.29%, 47% 87%, 2% 98%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)"
              //     : "polygon(157% 9px, 91.98% 23.55%, 38.91% 29.77%, 77.37% 95.29%, 101% 104%, 21% 100%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)";

              break;
            case "MODERN_COLOUR":
              transform =
                size === "large"
                  ? "translate3d(-23px, 12px, 0px)"
                  : size === "small"
                  ? "translate3d(-22px, 24px, 0px)"
                  : "translate3d(-9px, 2px, 0px) rotate(-2deg)";

              width =
                size === "large" ? "34px" : size === "small" ? "22px" : "28px";
              // polygone =
              //   size === "large"
              //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 70.37% 85.29%, 148% 115%, 27% 115%, 1% 87%, 8% 82%, -24px 56%, 6px 0px)"
              //     : size === "small"
              //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 84.37% 95.29%, 47% 87%, 2% 98%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)"
              //     : "polygon(157% 9px, 91.98% 23.55%, 38.91% 29.77%, 77.37% 95.29%, 101% 104%, 21% 100%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)";

              break;
            case "BRUSHED":
              transform =
                size === "large"
                  ? "translate3d(8px, -2px, 0px)"
                  : size === "small"
                  ? "translate3d(8px, -2px, 0px)"
                  : "translate3d(8px, 4px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "22px";
              // polygone =
              //   size === "large"
              //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 70.37% 85.29%, 148% 115%, 27% 115%, 1% 87%, 8% 82%, -24px 56%, 6px 0px)"
              //     : size === "small"
              //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
              //     : "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)";

              break;
            case "SIMPLE_HOOP":
              transform =
                size === "large"
                  ? "translate3d(-20px, 6px, 0px)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "32px" : size === "small" ? "22px" : "28px";
              // polygone =
              //   size === "large"
              //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
              //     : size === "small"
              //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
              //     : "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)";

              break;

            case "STUDSTAR":
              transform =
                size === "large"
                  ? "translate3d(4px, 23px, 0px) rotate(45deg)"
                  : size === "small"
                  ? "translate3d(4px, 15px, 0px) rotate(43deg)"
                  : "translate3d(4px, 23px, 0px) rotate(45deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "STUDMINI":
              transform =
                size === "large"
                  ? "translate3d(-2px, 2px, 0px) rotate(45deg)"
                  : size === "small"
                  ? "translate3d(-2px, 2px, 0px) rotate(45deg)"
                  : "translate3d(-2px, 2px, 0px) rotate(45deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "30px" : "30px";
              break;
            case "STUDLIGHTNING":
              transform =
                size === "large"
                  ? "translate3d(5px, 2px, 0px) rotate(-1deg)"
                  : size === "small"
                  ? "translate3d(5px, 2px, 0px) rotate(-1deg)"
                  : "translate3d(5px, 2px, 0px) rotate(-1deg)";
              width =
                size === "large" ? "25px" : size === "small" ? "25px" : "25px";
              break;
            case "STUDMOON":
              transform =
                size === "large"
                  ? "translate3d(4px, 23px, 0px) rotate(45deg)"
                  : size === "small"
                  ? "translate3d(4px, 12px, 0px) rotate(209deg)"
                  : "translate3d(4px, 23px, 0px) rotate(45deg)";
              width =
                size === "large" ? "30px" : size === "small" ? "25px" : "27px";
              break;
            case "CLUSTER":
              transform =
                size === "large"
                  ? "translate3d(5px, 2px, 0px) rotate(199deg)"
                  : size === "small"
                  ? "translate3d(3px, 9px, 0px) rotate(213deg)"
                  : "translate3d(5px, 4px, 0px) rotate(214deg)";
              width =
                size === "large" ? "25px" : size === "small" ? "30px" : "28px";
              break;

            case "Constellation":
              transform =
                size === "large"
                  ? "translate3d(8px, 4px, 0px) rotate(197deg)"
                  : size === "small"
                  ? "translate3d(6px, 2px, 0px) rotate(195deg)"
                  : "translate3d(8px, 4px, 0px) rotate(197deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "21px" : "28px";
              break;
            case "Star_Chain":
              transform =
                size === "large"
                  ? "translate3d(12px, 0px, 0px) rotate(330deg)"
                  : size === "small"
                  ? "translate3d(4px, 9px, 0px) rotate(22deg)"
                  : "translate3d(12px, 0px, 0px) rotate(330deg)";
              width =
                size === "large" ? "29px" : size === "small" ? "21px" : "28px";
              break;
            case "TWISTED_GOLD":
              transform =
                size === "large"
                  ? "translate3d(-4px, -12px, 0px) rotate(9deg)"
                  : size === "small"
                  ? "translate3d(-13px, 21px, 0px)"
                  : "translate3d(-14px, 11px, 0px)";

              width =
                size === "large" ? "27px" : size === "small" ? "22px" : "28px";
              break;
            default:
              transform =
                size === "large"
                  ? "translate(-4px, 7px)"
                  : size === "small"
                  ? "translate(-4px, 7px)"
                  : "translate(-4px, 7px)";

              width =
                size === "large" ? "26px" : size === "small" ? "20px" : "23px";
              break;
          }
          break;
        
        default:
      }
    } else {
      switch (pos) {
        case "D":
        switch (earringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(7px, 47px) rotate(30deg)"
                : size === "small"
                ? "translate(7px, 47px) rotate(30deg)"
                : "translate(7px, 47px) rotate(30deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "27px" : "28px";
  
            break;
  
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate(11px, 12px) rotate(-122deg)"
                : size === "small"
                ? "translate(11px, 12px) rotate(-122deg)"
                : "translate(11px, 12px) rotate(-122deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "32px" : "33px";
            break;
          case "STUD":
            transform =
              size === "large"
                ? "translate3d(18px, 23px, 0px) rotate(19deg)"
                : size === "small"
                ? "translate3d(18px, 23px, 0px) rotate(19deg)"
                : "translate3d(18px, 23px, 0px) rotate(19deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(20px, 11px, 0px) rotate(-1deg)"
                : size === "small"
                ? "translate3d(20px, 11px, 0px) rotate(-1deg)"
                : "translate3d(20px, 11px, 0px) rotate(-1deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "22px" : "22px";
            break;
          case "MODERN_COLOUR":
            transform =
              size === "large"
                ? "translate3d(15px, 13px, 0px)"
                : size === "small"
                ? "translate3d(11px, 9px, 0px)"
                : "translate3d(14px, 12px, 0px)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "22px" : "30px";
            break;
          case "BRUSHED":
            transform =
              size === "large"
                ? "translate3d(16px, 16px, 0px)"
                : size === "small"
                ? "translate3d(18px, 17px, 0px)"
                : "translate3d(18px, 17px, 0px)";
  
            width =
              size === "large" ? "19px" : size === "small" ? "22px" : "18px";
            break;
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(17px, 9px, 0px)"
                : size === "small"
                ? "translate3d(17px, 9px, 0px)"
                : "translate3d(17px, 9px, 0px)";
  
            width =
              size === "large" ? "28px" : size === "small" ? "22px" : "25px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate3d(16px, 10px, 0px)"
                : size === "small"
                ? "translate3d(16px, 9px, 0px)"
                : "translate3d(16px, 9px, 0px)";
  
            width =
              size === "large" ? "23px" : size === "small" ? "22px" : "28px";
            break;
          default:
            transform =
              size === "large"
                ? "translate3d(15px, 10px, 0px) rotate(-23deg)"
                : size === "small"
                ? "translate3d(18px, 10px, 0px)"
                : "translate3d(16px, 11px, 0px) rotate(-23deg)";
  
            width =
              size === "large" ? "27px" : size === "small" ? "22px" : "26px";
  
            break;
            
        }
        break;
        case "DotD":
        switch (earringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(7px, 45px) rotate(30deg)"
                : size === "small"
                ? "translate(7px, 8px) rotate(8deg)"
                : "translate(7px, 45px) rotate(30deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "31px" : "32px";
  
            break;
          case "DIAMONDCRAWLER":
            transform =
              size === "large"
                ? "translate(7px, 5px) rotate(317deg)"
                : size === "small"
                ? "translate(7px, 5px) rotate(215deg)"
                : "translate(7px, 5px) rotate(317deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "32px" : "32px";
  
            break;
          case "DIAMOND_CRAWLER":
            transform =
              size === "large"
                ? "translate(7px, 19px) rotate(165deg)"
                : size === "small"
                ? "translate(7px, 19px) rotate(165deg)"
                : "translate(7px, 19px) rotate(165deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "31px" : "32px";
  
            break;
  
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate(8px, -6px) rotate(351deg)"
                : size === "small"
                ? "translate(11px, 4px) rotate(16deg)"
                : "translate(11px, 15px) rotate(-133deg)";
            width =
              size === "large" ? "27px" : size === "small" ? "32px" : "33px";
            break;
          case "Constellation":
            transform =
              size === "large"
                ? "translate(15px, 1px) rotate(-176deg)"
                : size === "small"
                ? "translate(15px, 1px) rotate(-176deg)"
                : "translate(15px, 1px) rotate(-176deg)";
            width =
              size === "large" ? "23px" : size === "small" ? "21px" : "22px";
            break;
          case "Star_Chain":
            transform =
              size === "large"
                ? "translate(15px, 1px) rotate(355deg)"
                : size === "small"
                ? "translate(15px, 1px) rotate(355deg)"
                : "translate(15px, 1px) rotate(355deg)";
            width =
              size === "large" ? "23px" : size === "small" ? "21px" : "22px";
            break;
          case "STUDSTAR":
            transform =
              size === "large"
                ? "translate(13px, 11px) rotate(-3deg)"
                : size === "small"
                ? "translate(13px, 11px) rotate(-3deg)"
                : "translate(13px, 11px) rotate(-3deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "27px";
            break;
          case "STUDLIGHTNING":
            transform =
              size === "large"
                ? "translate(13px, 2px) rotate(326deg)"
                : size === "small"
                ? "translate(13px, 2px) rotate(326deg)"
                : "translate(13px, 2px) rotate(326deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "STUDMINI":
            transform =
              size === "large"
                ? "translate3d(18px, 23px, 0px) rotate(19deg)"
                : size === "small"
                ? "translate(7px, 25px) rotate(30deg)"
                : "translate3d(18px, 23px, 0px) rotate(19deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "30px";
            break;
          case "STUDMOON":
            transform =
              size === "large"
                ? "translate3d(10px, 10px, 0px) rotate(348deg)"
                : size === "small"
                ? "translate3d(10px, 10px, 0px) rotate(348deg)"
                : "translate3d(10px, 10px, 0px) rotate(348deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "26px" : "27px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(-23px, 0px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 12px, 0px)"
                : "translate3d(-16px, 5px, 0px)";
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "MODERN_COLOUR":
            transform =
              size === "large"
                ? "translate3d(-23px, 12px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 24px, 0px)"
                : "translate3d(-16px, 22px, 0px)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "22px" : "28px";
            break;
          case "BRUSHED":
            transform =
              size === "large"
                ? "translate3d(-20px, -3px, 0px)"
                : size === "small"
                ? "translate3d(-13px, 16px, 0px)"
                : "translate3d(-14px, 8px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(-20px, 6px, 0px)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate3d(-16px, 3px, 0px)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          default:
            transform =
              size === "large"
                ? "translate3d(-16px, 8px, 0px)"
                : size === "small"
                ? "translate3d(-13px, 16px, 0px)"
                : "translate3d(-16px, 12px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
  
            break;
        }
        break;
        case "D1":
          switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(15px, -2px) rotate(0deg)"
                  : size === "small"
                  ? "translate(15px, -2px) rotate(0deg)"
                  : "translate(15px, -2px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "17px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(29% 0, 53% 32%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;   
              case"ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(12px, 1px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 1px) rotate(0deg)"
                  : "translate(12px, 1px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "22px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(29% 0, 53% 32%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;   
              case"CROSS" :
              transform =
              size === "large"
                ? "translate(12px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -3px) rotate(0deg)"
                : "translate(12px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(29% 0, 53% 32%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
               :  ""
            break ;   
            case"PEACE" :
              transform =
              size === "large"
                ? "translate(13px, 7px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 7px) rotate(0deg)"
                : "translate(13px, 7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(29% 0, 53% 32%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
               :  ""
            break ;   
            case"SHOOTING" :
            transform =
            size === "large"
              ? "translate(14px, 1px) rotate(0deg)"
              : size === "small"
              ? "translate(14px, 1px) rotate(0deg)"
              : "translate(14px, 1px) rotate(0deg)";
          width =
            size === "large" ? "24px" : size === "small" ? "22px" : "23px";
            clipPath =
            size === "large" ?
             "" :  size === "small" ?  " polygon(0 0, 26% 0, 37% 21%, 61% 15%, 100% 0, 100% 25%, 100% 50%, 100% 59%, 100% 100%, 0 100%, 0 66%, 0 45%)" 
             :  ""
          break ;  
          case"PRECIOUS" :
          transform =
          size === "large"
            ? "translate(13px, 7px) rotate(0deg)"
            : size === "small"
            ? "translate(13px, 7px) rotate(0deg)"
            : "translate(13px, 7px) rotate(0deg)";
        width =
          size === "large" ? "17px" : size === "small" ? "17px" : "17px";
          clipPath =
          size === "large" ?
           "" :  size === "small" ?  "polygon(29% 0, 53% 32%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
           :  ""
        break ;      
        case"DARLING" :
        transform =
        size === "large"
          ? "translate(15px, -1px) rotate(0deg)"
          : size === "small"
          ? "translate(15px, -1px) rotate(0deg)"
          : "translate(15px, -1px) rotate(0deg)";
      width =
        size === "large" ? "24px" : size === "small" ? "16px" : "23px";
        clipPath =
        size === "large" ?
         "" :  size === "small" ?  "polygon(29% 0, 53% 32%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
         :  ""
      break ; 
      case"MARVELOUS" :
      transform =
      size === "large"
        ? "translate(12px, -2px) rotate(0deg)"
        : size === "small"
        ? "translate(12px, -2px) rotate(0deg)"
        : "translate(12px, -2px) rotate(0deg)";
    width =
      size === "large" ? "24px" : size === "small" ? "22px" : "23px";
      clipPath =
      size === "large" ?
       "" :  size === "small" ?  "polygon(29% 0, 53% 32%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
       :  ""
    break ;  
    case"PLANET" :
    transform =
    size === "large"
      ? "translate(11px, 0px) rotate(0deg)"
      : size === "small"
      ? "translate(11px, 0px) rotate(0deg)"
      : "translate(11px, 0px) rotate(0deg)";
  width =
    size === "large" ? "17px" : size === "small" ? "23px" : "17px";
    clipPath =
    size === "large" ?
     "" :  size === "small" ?  "polygon(29% 0, 53% 32%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
     :  ""
  break ;      
  case"PEACESIGN" :
  transform =
  size === "large"
    ? "translate(13px, 7px) rotate(0deg)"
    : size === "small"
    ? "translate(11px, 0px) rotate(0deg)"
    : "translate(13px, 7px) rotate(0deg)";
  width =
  size === "large" ? "22px" : size === "small" ? "24px" : "22px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 37% 0, 55% 22%, 87% 18%, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ;  
  case"HAND" :
  transform =
  size === "large"
    ? "translate(11px, 0px) rotate(0deg)"
    : size === "small"
    ? "translate(11px, 0px) rotate(0deg)"
    : "translate(11px, 0px) rotate(0deg)";
  width =
  size === "large" ? "22px" : size === "small" ? "24px" : "22px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 37% 0, 55% 22%, 87% 18%, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ;  
  case"CELESTIAL" :
  transform =
  size === "large"
    ? "translate(13px, 7px) rotate(0deg)"
    : size === "small"
    ? "translate(12px, 10px) rotate(0deg)"
    : "translate(13px, 10px) rotate(0deg)";
  width =
  size === "large" ? "22px" : size === "small" ? "22px" : "22px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 37% 0, 55% 22%, 87% 18%, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ;
  case"SUMMER" :
  transform =
  size === "large"
    ? "translate(11px, 2px) rotate(0deg)"
    : size === "small"
    ? "translate(11px, 2px) rotate(0deg)"
    : "translate(11px, 2px) rotate(0deg)";
  width =
  size === "large" ? "22px" : size === "small" ? "22px" : "22px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 37% 0, 55% 22%, 87% 18%, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ;  
          }
          break;
        case "A":
        case 'A1' : 
        switch (circleEarringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(-65px, 44px) rotate(64deg)"
                : size === "small"
                ? "translate(57px, 44px) rotate(14deg)"
                : "translate(-65px, 44px) rotate(64deg)";
            width =
              size === "large" ? "50px" : size === "small" ? "30px" : "40px";
            break;
            case "TRIODIAMOND" :
              transform =
              size === "large"
                ? "translate(-65px, 44px) rotate(64deg)"
                : size === "small"
                ? "translate(57px, 44px) rotate(14deg)"
                : "translate(-65px, 44px) rotate(64deg)";
            width =
              size === "large" ? "50px" : size === "small" ? "30px" : "40px";
            break ;
          case "KNIFE_EDGED":
            switch (earringType) {    
              case "TRIODIAMOND":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(17px, -2px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "16px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 15% 17%, 31% 34%, 67% 16%, 58% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;  
              case "ENTRANCING":
                transform =
                size === "large"
                  ? "translate(5px, -7px) rotate(0deg)"
                  : size === "small"
                  ? "translate(10px, -2px) rotate(0deg)"
                  : "translate(5px, -7px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "29px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 4px, 29% 17%, 49% 36%, 61% 16%, 58% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;    
              case "CROSS":
                transform =
                size === "large"
                  ? "translate(5px, -7px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, -2px) rotate(0deg)"
                  : "translate(5px, -7px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 4px, 24% 7%, 48% 32%, 64% 13%, 66% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "PEACE":
                transform =
                size === "large"
                  ? "translate(5px, -7px) rotate(0deg)"
                  : size === "small"
                  ? "translate(10px, -2px) rotate(0deg)"
                  : "translate(5px, -7px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "29px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 4px, 22% 5%, 49% 26%, 61% 16%, 58% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(15px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "  polygon(2% 0, 12% 8%, 24% 17%, 45% 14%, 42% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
            break ; 
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(14px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "20px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 4px, 18% 0%, 48% 32%, 64% 13%, 66% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;   
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(14px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "20px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 4px, 18% 0%, 48% 32%, 64% 13%, 66% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;     
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 4px, 22% 5%, 49% 26%, 61% 16%, 58% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 4px, 22% 5%, 49% 26%, 61% 16%, 58% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(10px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 4px, 17% 1%, 49% 26%, 61% 16%, 58% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"HAND" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(10px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 4px, 17% 1%, 49% 26%, 61% 16%, 58% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(14px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "20px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 4px, 13% 12%, 51% 23%, 64% 13%, 66% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;  
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(10px, -2px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 4px, 17% 1%, 49% 26%, 61% 16%, 58% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;   
               default : 
    transform =
              size === "large"
                ? "translate3d(-1px, -5px, 0px) rotate(25deg)"
                : size === "small"
                ? "translate3d(-1px, -2px, 0px) rotate(25deg)"
                : "translate3d(-1px, -5px, 0px) rotate(25deg)";
            width =
              size === "large" ? "45px" : size === "small" ? "41px" : "45px";
            break;
              }     
              break;
            
          case "MODERN_COLOUR":
            switch (earringType) {    
              case "TRIODIAMOND":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(20px, -1px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "18px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 12%, 31% 24%, 62% 11%, 48% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "ENTRANCING":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, -1px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 12%, 31% 24%, 62% 11%, 48% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "CROSS":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(19px, -2px) rotate(1deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "18px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 12%, 41% 30%, 49% 20%, 50% -2px, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "PEACE":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(15.5px, -2px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 25% 23%, 14% 28%, 59% 11%, 48% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -4px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  " polygon(2% 0, 13% 9%, 27% 18%, 43% 11%, 32% 1%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
            break ; 
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(19px, -2px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "18px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 11% 8%, 40% 19%, 72% 13%, 46% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
            break ;  
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(19px, -2px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "18px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 11% 8%, 40% 19%, 72% 13%, 46% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
            break ;  
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -2px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 29% 13%, 42% 22%, 68% 10%, 47% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 52%)" 
               :  ""
            break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -2px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 21% 18%, 45% 24%, 64% 22%, 47% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
            break ;  
              case"PEACESIGN" :
              transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(15.5px, -2px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 25% 23%, 14% 28%, 59% 11%, 48% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"HAND" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(15px, -2px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 22% 11%, 42% 22%, 60% 7%, 50% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
            break ;  
              case"CELESTIAL" :
              transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(18px, -2px) rotate(1deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 15% 15%, 11% 16%, 49% 19%, 43% -2px, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -2px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 29% 13%, 37% 22%, 58% 7%, 45% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
            break ;  
               default : 
               transform =
               size === "large"
                 ? "translate3d(-1px, -7px, 0px) rotate(27deg)"
                 : size === "small"
                 ? "translate3d(8px, -2px, 0px)"
                 : "translate3d(2px, -7px, 0px) rotate(30deg)";
   
             width =
               size === "large" ? "46px" : size === "small" ? "47px" : "46px";
             break;
              }  
              break;
           
          case "BRUSHED":
            switch (earringType) {    
              case "TRIODIAMOND":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(15px, -3px) rotate(2deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "16px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 19% 12%, 31% 24%, 59% 14%, 53% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;  
              case "ENTRANCING":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(13px, -3px) rotate(2deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "22px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 16%, 38% 24%, 49% 14%, 53% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "CROSS":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, -3px) rotate(1deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "18px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 12%, 41% 30%, 49% 20%, 50% -2px, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "PEACE":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(13px, -3px) rotate(2deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "22px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 21% 17%, 27% 24%, 49% 14%, 53% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -4px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 20% 8%, 24% 17%, 45% 14%, 42% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -3px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "18px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 4% 5%, 40% 15%, 64% 8%, 38% 0px, 99% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
            break ;  
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -3px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "18px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 4% 6%, 39% 16%, 64% 8%, 38% 0px, 99% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
            break ;  
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "16px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 29% 11%, 42% 22%, 68% 10%, 49% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 52%)" 
               :  ""
            break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "16px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 29% 11%, 42% 22%, 68% 10%, 49% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 52%)" 
               :  ""
            break ;  
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 21% 17%, 27% 24%, 49% 14%, 53% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;  
              case"HAND" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 21% 17%, 27% 24%, 49% 14%, 53% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"CELESTIAL" :
              transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, -3px) rotate(1deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "18px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 15% 15%, 11% 16%, 49% 19%, 43% -2px, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 21% 17%, 27% 24%, 49% 14%, 44% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
               default : 
               transform =
               size === "large"
                 ? "translate3d(5px, -16px, 0px) rotate(26deg)"
                 : size === "small"
                 ? "translate3d(6px, 7px, 0px) rotate(4deg)"
                 : "translate3d(3px, -16px, 0px) rotate(21deg)";
   
             width =
               size === "large" ? "36px" : size === "small" ? "38px" : "36px";
             break;
              }     
              break;
        
          case "SIMPLE_HOOP":
            switch (earringType) {    
              case "TRIODIAMOND":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(15px, -3px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 19% 12%, 31% 24%, 59% 14%, 53% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;  
              case "ENTRANCING":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(11px, -3px) rotate(2deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "28px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 16%, 38% 24%, 49% 14%, 53% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "CROSS":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, -3px) rotate(1deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "18px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 12%, 41% 30%, 49% 20%, 50% -2px, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "PEACE":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(11px, -3px) rotate(2deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "28px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 21% 17%, 27% 24%, 49% 14%, 53% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -4px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 20% 8%, 24% 17%, 45% 14%, 42% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -3px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "18px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 14% 7%, 31% 19%, 72% 13%, 46% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
            break ;  
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -3px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "18px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 14% 7%, 31% 19%, 72% 13%, 46% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
            break ;  
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 29% 11%, 42% 22%, 68% 10%, 49% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 52%)" 
               :  ""
            break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 29% 11%, 42% 22%, 68% 10%, 49% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 52%)" 
               :  ""
            break ;  
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(11px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "28px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 21% 17%, 27% 24%, 49% 14%, 53% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;  
              case"HAND" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "26px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 21% 17%, 27% 24%, 49% 14%, 53% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(15px, -3px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "23px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 19% 12%, 41% 23%, 49% 20%, 50% -2px, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;  
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 21% 17%, 27% 24%, 49% 14%, 44% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
               default : 
               transform =
              size === "large"
                ? "translate3d(-2px, -1px, 0px) rotate(26deg)"
                : size === "small"
                ? "translate3d(-2px, -1px, 0px) rotate(26deg)"
                : "translate3d(-3px, -2px, 0px) rotate(23deg)";
  
            width =
              size === "large" ? "40px" : size === "small" ? "35px" : "40px";
            break;
              }     
              break;
          
          case "STUD":
            transform =
              size === "large"
                ? "translate(-20%, 30%) rotate(0deg)"
                : size === "small"
                ? "translate3d(63px, 38px, 0px)"
                : "translate(-20%, 30%) rotate(0deg)";
            width =
              size === "large" ? "35px" : size === "small" ? "22px" : "32px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(63px, 19px, 0px) rotate(67deg)"
                : size === "small"
                ? "translate3d(63px, 25px, 0px) rotate(89deg)"
                : "translate3d(63px, 25px, 0px) rotate(89deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "28px" : "40px";
            break;
          case "TWISTED_GOLD":
            switch (earringType) {    
              case "TRIODIAMOND":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, -6px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 33% 2%, 28% 17%, 67% 29%, 71% 2%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;  
              case "ENTRANCING":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(5px, -6px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "30px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 36% 6%, 40% 17%, 67% 29%, 71% 2%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;   
              case "CROSS":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(11px, -6px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 33% 2%, 28% 17%, 67% 29%, 71% 2%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;  
              case "PEACE":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(5px, -6px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "30px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 40% 1%, 38% 0%, 70% 29%, 71% 2%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(7px, -6px) rotate(11deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 13% -2%, 28% 11%, 43% 17%, 59% 11%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -6px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "15px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 39% 1%, 18% 14%, 73% 23%, 89% 8%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
            break ;   
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -6px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "15px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 39% 1%, 18% 14%, 73% 23%, 89% 8%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
            break ;     
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(4px, -6px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 39% 2%, 40% 17%, 64% 25%, 71% 2%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(4px, -6px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 39% 2%, 40% 17%, 64% 25%, 71% 2%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(5px, -6px) rotate(0deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 40% 1%, 38% 0%, 70% 29%, 71% 2%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"HAND" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(4px, -6px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 39% 2%, 40% 19%, 95% 21%, 71% 2%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(8px, -7px) rotate(0deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 33% 2%, 42% 16%, 64% 21%, 86% 2%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;  
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(4px, -6px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 39% 2%, 40% 19%, 95% 21%, 71% 2%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;   
               default : 
               transform =
               size === "large"
                 ? "translate3d(4px, -4px, 0px) rotate(193deg)"
                 : size === "small"
                 ? "translate3d(8px, -4px, 0px) rotate(193deg)"
                 : "translate3d(4px, -4px, 0px) rotate(193deg)";
   
             width =
               size === "large" ? "24px" : size === "small" ? "22px" : "28px";
             break;
              }     
              break;
           
          default:
            switch (earringType) {    
              case "TRIODIAMOND":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, -4px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "18px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 19% 12%, 31% 24%, 62% 11%, 48% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;  
              case "ENTRANCING":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(10.5px, -4px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 19%, 44% 27%, 59% 11%, 48% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "CROSS":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, -4px) rotate(1deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "18px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 12%, 41% 30%, 49% 20%, 50% -2px, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case "PEACE":
                transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(10.5px, -4px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 19%, 30% 28%, 59% 11%, 48% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(5px, -7px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -4px) rotate(0deg)"
                : "translate(5px, -7px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "29px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 18% 6%, 24% 14%, 43% 13%, 39% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ; 
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -3px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "18px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 23% 0px, 31% 11%, 72% 13%, 57% 0px, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0px 50%)" 
               :  ""
            break ;  
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -3px) rotate(1deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "18px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 23% 0px, 29% 11%, 72% 13%, 57% 0px, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0px 50%)" 
               :  ""
            break ;  
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(11px, -4px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 29% 11%, 42% 22%, 68% 10%, 47% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 52%)" 
               :  ""
            break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(11px, -4px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 31% 14%, 45% 22%, 61% 10%, 51% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
            break ;  
              case"PEACESIGN" :
              transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(10.5px, -4px) rotate(0deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 19% 19%, 30% 28%, 59% 11%, 48% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"HAND" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(11px, -4px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 22% 11%, 42% 22%, 60% 7%, 50% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
            break ;  
              case"CELESTIAL" :
              transform =
                size === "large"
                  ? "translate(5px, -8px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, -3px) rotate(1deg)"
                  : "translate(5px, -8px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "18px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 15% 15%, 11% 16%, 49% 19%, 43% -2px, 95% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;  
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(5px, -8px) rotate(0deg)"
                : size === "small"
                ? "translate(11px, -3px) rotate(2deg)"
                : "translate(5px, -8px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 29% 13%, 37% 22%, 58% 7%, 45% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
            break ;  
               default : 
               transform =
               size === "large"
                 ? "translate3d(0px, -8.5px, 6px) rotate(395deg)"
                 : size === "small"
                 ? "translate3d(-3.5px, -0.5px, 6px) rotate(395deg)"
                 : "translate3d(0px, -8.5px, 6px) rotate(395deg)";
   
             width =
               size === "large" ? "44px" : size === "small" ? "40px" : "43px";
             break;
              }     
              break;
        }
        break;
        case "B":
        case "B1" :
        switch (circleEarringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(15px, 13px) rotate(104deg)"
                : size === "small"
                ? "translate(24px, 13px) rotate(1deg)"
                : "translate(15px, 13px) rotate(104deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "30px" : "28px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(-11px, 29px, 0px) rotate(209deg)"
                : size === "small"
                ? "translate3d(-11px, 29px, 0px) rotate(209deg)"
                : "translate3d(-11px, 29px, 0px) rotate(209deg)";
            width =
              size === "large" ? "64px" : size === "small" ? "62px" : "63px";
             
              clipPath =
              size === "large" ? "polygon(-27% 37px, 78% -7px, 100% 42%, 100% 71%, 88% 94%, 55% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)" : 
              size === "small" ? "" : "polygon(-27% 37px, 78% -7px, 100% 42%, 100% 71%, 88% 94%, 55% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)";
            
              break;
          case "MODERN_COLOUR":
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(17px, 6px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 37% 0, 36% 17%, 58% 13%, 55% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, 7px) rotate(3deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 37% 0, 36% 23%, 58% 13%, 55% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(18.5px, 7px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "15px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0 0, 42% 0, 34% 11%, 69% 13%, 62% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14.5px, 7px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 41% 0px, 36% 26%, 53% 17%, 57% 1px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(15px, 8px) rotate(12deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 18% 3%, 25% 16%, 43% 8%, 36% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
                break ;  
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(19px, 6px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "15px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 32% 0, 27% 15%, 71% 13%, 57% 0, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
               break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(19px, 6px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "15px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 32% 0, 27% 15%, 71% 22%, 57% 0, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
              break ; 
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 6px) rotate(2deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 41% 0px, 55% 32%, 55% 16%, 59% 1px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 6px) rotate(2deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 41% 0px, 55% 32%, 55% 16%, 59% 1px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
                break ;      
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(14.5px, 7px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 41% 0px, 36% 26%, 53% 17%, 57% 1px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;   
              case"HAND" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(14px, 7px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 41% 0px, 36% 26%, 53% 17%, 57% 1px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, 6px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "20px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 41% 0px, 36% 26%, 53% 17%, 57% 2px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ; 
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(14px, 6px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 41% 0px, 43% 26%, 53% 17%, 57% 1px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
             break ;     
              default : 
              transform =
              size === "large"
                ? "translate3d(-3px, 8px, 0px) rotate(-141deg)"
                : size === "small"
                ? "translate3d(10px, 2px, 0px) rotate(-7deg)"
                : "translate3d(6px, 11px, 0px) rotate(-103deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "34px" : "34px";
              clipPath =
              size === "large" ? "polygon(-27% 37px, 78% -7px, 100% 42%, 100% 71%, 88% 94%, 55% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)" : 
              size === "small" ? "" : "polygon(-27% 37px, 78% -7px, 100% 42%, 100% 71%, 88% 94%, 55% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)";
            
              break;
          }
         break;
           
          case "BRUSHED":
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, -4px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 11% 11%, 33% 25%, 56% 10%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, -2px) rotate(1deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 11% 11%, 33% 25%, 56% 10%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(8px, -4px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, -4px) rotate(0deg)"
                  : "translate(8px, -4px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "15px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0px 0px, 3% 15%, 36% 22%, 69% 9%, 10% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0px 50%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, -2px) rotate(1deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 56% 24%, 51% 6%, 39% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 8% 9%, 25% 16%, 39% 6%, 15% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
                break ;  
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, -2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "12px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 2% 11%, 40% 20%, 69% 11%, 27% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
               break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, -2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "12px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 2% 11%, 40% 20%, 69% 11%, 27% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
              break ; 
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(10px, -3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 2%, 26% 2%, 45% 19%, 62% 8%, 42% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 2% 100%, 0px 47%)" 
               :  ""
              break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(10px, -3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 2%, 26% 2%, 45% 19%, 62% 8%, 42% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 2% 100%, 0px 47%)" 
               :  ""
                break ;      
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -2px) rotate(1deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 56% 24%, 51% 6%, 39% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;   
              case"HAND" :
              transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(9px, -4px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 48% 20%, 54% 2%, 11% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;
              case"CELESTIAL" :
              transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(11px, -5px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 45% 21%, 51% 6%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 43% 24%, 51% 6%, 11% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
             break ;     
              default : 
              transform =
              size === "large"
                ? "translate3d(1px, 12px, 0px) rotate(-121deg)"
                : size === "small"
                ? "translate3d(22px, 38px, 0px) rotate(0deg)"
                : "translate3d(1px, 12px, 0px) rotate(-121deg)";
  
            width =
              size === "large" ? "40px" : size === "small" ? "54px" : "40px";
              break;
          }
         break;
          
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(-9px, 26px, 0px) rotate(136deg)"
                : size === "small"
                ? "translate3d(10px, 33px, 0px) rotate(-9deg)"
                : "translate3d(-8px, 14px, 0px) rotate(154deg)";
  
            width =
              size === "large" ? "46px" : size === "small" ? "48px" : "54px";
            
              clipPath =
              size === "large" ? "polygon(20% 46px, 21% 4px, 98% 42%, 100% 75%, 61% 108%, 55% 100%, 27% 87%, -88% 71%, 5% -2px, 66% 29%)" : 
              size === "small" ? "" : "";
            
              break;
          case "STUD":
            transform =
              size === "large"
                ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                : size === "small"
                ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                : "translate3d(17px, 19px, 0px) rotate(22deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(15px, -3px, 0px) rotate(143deg)"
                : size === "small"
                ? "translate3d(18px, 10px, 0px) rotate(161deg)"
                : "translate3d(18px, 10px, 0px) rotate(161deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "27px" : "28px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate3d(5px, 3px, 0px) rotate(66deg)"
                : size === "small"
                ? "translate3d(5px, 3px, 0px) rotate(66deg)"
                : "translate3d(5px, 3px, 0px) rotate(66deg)";
  
            width =
              size === "large" ? "40px" : size === "small" ? "22px" : "28px";
              clipPath =
              size === "large" ? "polygon(62% 0px, 103% 0px, 100% 32%, 76% 96%, 92% 94%, 58% 100%, 4% 97%, -4% 64%, 26% 5px, 47% 29%)" : 
              size === "small" ? "" : "polygon(62% 0px, 103% 0px, 100% 32%, 76% 96%, 92% 94%, 58% 100%, 4% 97%, -4% 64%, 26% 5px, 47% 29%)";
            
            break;
          default:
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, 2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 11% 23%, 33% 25%, 51% 10%, 17% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 38% 33%, 51% 10%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(8px, -4px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, 2px) rotate(0deg)"
                  : "translate(8px, -4px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "17px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0 0, 8% 22%, 36% 21%, 63% 9%, 31% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 38% 24%, 51% 6%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, 2px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 8% 20%, 25% 16%, 39% 6%, 15% 0, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
                break ;  
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, 2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "15px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 2% 17%, 39% 18%, 69% 11%, 27% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
               break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, 2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "15px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 2% 19%, 40% 20%, 69% 11%, 27% 1%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
              break ; 
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, 1px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 38% 24%, 51% 6%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, 1px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 38% 24%, 51% 6%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
                break ;      
              case"PEACESIGN" :
              transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 38% 24%, 51% 6%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;   
              case"HAND" :
              transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 38% 24%, 51% 6%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ;
              case"CELESTIAL" :
              transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 1px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 38% 21%, 51% 6%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SUMMER" :
              transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 0% 0%, 38% 24%, 51% 6%, 17% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
             break ;     
              default : 
              transform =
              size === "large"
                ? "translate(7px, -1px) rotate(316deg)"
                : size === "small"
                ? "translate(7px, -1px) rotate(315deg)"
                : "translate(7px, -1px) rotate(316deg)";
  
            width =
              size === "large" ? "25px" : size === "small" ? "27px" : "25px";
              // clipPath =
              // size === "large" ? "polygon(0 20%, 0 0, 74% 50%, 100% 0, 100% 61%, 63% 47%, 72% 1%, 100% 62%, 100% 100%, 0 99%, 0 62%, 0 51%)" : 
              // size === "small" ? "" : "polygon(0 20%, 0 0, 74% 50%, 100% 0, 100% 61%, 63% 47%, 72% 1%, 100% 62%, 100% 100%, 0 99%, 0 62%, 0 51%)";
            
            break;
          }
         break;
           
        }
        break;
        case "DotB":
        switch (earringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate3d(14px, -4px, 0px) rotate(-126deg)"
                : size === "small"
                ? "translate(7px, 8px) rotate(8deg)"
                : "translate(15px, 13px) rotate(104deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "30px" : "28px";
            break;
          case "DIAMONDCRAWLER":
            transform =
              size === "large"
                ? "translate(2px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(2px, 1px) rotate(266deg)"
                : "translate(2px, 1px) rotate(2deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "30px" : "28px";
            break;
          case "DIAMOND_CRAWLER":
            transform =
              size === "large"
                ? "translate(24px, 10px) rotate(-69deg)"
                : size === "small"
                ? "translate(24px, 10px) rotate(-69deg)"
                : "translate(24px, 10px) rotate(-69deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "30px" : "28px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(-23px, 0px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 12px, 0px)"
                : "translate3d(-16px, 5px, 0px)";
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "MODERN_COLOUR":
            transform =
              size === "large"
                ? "translate3d(4px, -16px, 0px) rotate(-7deg)"
                : size === "small"
                ? "translate3d(4px, -16px, 0px) rotate(-7deg)"
                : "translate3d(4px, -16px, 0px) rotate(-7deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "34px" : "38px";
            break;
          case "BRUSHED":
            transform =
              size === "large"
                ? "translate3d(34px, 9px, 0px) rotate(13deg)"
                : size === "small"
                ? "translate3d(34px, 9px, 0px) rotate(13deg)"
                : "translate3d(34px, 9px, 0px) rotate(13deg)";
  
            width =
              size === "large" ? "36px" : size === "small" ? "22px" : "32px";
            break;
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(-20px, 6px, 0px)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "STUDSTAR":
            transform =
              size === "large"
                ? "translate3d(7px, 8px, 0px) rotate(-33deg)"
                : size === "small"
                ? "translate3d(7px, 8px, 0px) rotate(-33deg)"
                : "translate3d(7px, 8px, 0px) rotate(-33deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "27px";
            break;
          case "STUDLIGHTNING":
            transform =
              size === "large"
                ? "translate3d(5px, 0px, 0px) rotate(12deg)"
                : size === "small"
                ? "translate3d(5px, 0px, 0px) rotate(12deg)"
                : "translate3d(5px, 0px, 0px) rotate(12deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "STUDMINI":
            transform =
              size === "large"
                ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                : size === "small"
                ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                : "translate3d(17px, 19px, 0px) rotate(22deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "30px";
            break;
          case "STUDMOON":
            transform =
              size === "large"
                ? "translate3d(17px, 19px, 0px) rotate(22deg)"
                : size === "small"
                ? "translate3d(9px, 5px, 0px) rotate(357deg)"
                : "translate3d(17px, 19px, 0px) rotate(22deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(5px, -14px, 0px) rotate(48deg)"
                : size === "small"
                ? "translate3d(5px, -4px, 0px) rotate(72deg)"
                : "translate3d(5px, -4px, 0px) rotate(72deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "30px" : "28px";
            break;
          case "Constellation":
            transform =
              size === "large"
                ? "translate3d(8px, -5px, 0px) rotate(40deg)"
                : size === "small"
                ? "translate3d(8px, -5px, 0px) rotate(40deg)"
                : "translate3d(8px, -5px, 0px) rotate(40deg)";
            width =
              size === "large" ? "23px" : size === "small" ? "21px" : "22px";
            break;
          case "Star_Chain":
            transform =
              size === "large"
                ? "translate3d(4px, -7px, 0px) rotate(42deg)"
                : size === "small"
                ? "translate3d(4px, -7px, 0px) rotate(42deg)"
                : "translate3d(4px, -7px, 0px) rotate(42deg)";
            width =
              size === "large" ? "23px" : size === "small" ? "21px" : "22px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate3d(21px, 3px, 0px)"
                : size === "small"
                ? "translate3d(21px, 3px, 0px)"
                : "translate3d(21px, 2px, 0px)";
  
            width =
              size === "large" ? "38px" : size === "small" ? "22px" : "28px";
            break;
          default:
            transform =
              size === "large"
                ? "translate(27px, -6px) rotate(74deg)"
                : size === "small"
                ? "translate(26px, -7px) rotate(71deg)"
                : "translate(26px, -10px) rotate(71deg)";
  
            width =
              size === "large" ? "35px" : size === "small" ? "25px" : "30px";
            break;
        }
        break;
        case "E":
        switch (earringType) {
          case "CRAWLER":
            transform =
              size === "large" 
                ? "translate(16px, 16px) rotate(52deg)"
                : size === "small"
                ? "translate(16px, 16px) rotate(52deg)"
                : "translate(16px, 16px) rotate(52deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "27px" : "28px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(4px, 21px, 0px) rotate(86deg)"
                : size === "small"
                ? "translate3d(14px, 21px, 0px) rotate(-23deg)"
                : "translate3d(6px, 24px, 0px) rotate(82deg)";
            width =
              size === "large" ? "42px" : size === "small" ? "36px" : "34px";
              // clipPath =
              // size === "large" ? "polygon(-27% 165px, 78% 9px, 52% -74%, 120% 92%, 77% 103%, 55% 100%, 73% 101%, -28% 83%, 11% 4px, 75% 29%)" : 
              // size === "small" ? "" : "polygon(-27% 165px, 78% 9px, 52% -74%, 120% 92%, 77% 103%, 55% 100%, 73% 101%, -28% 83%, 11% 4px, 75% 29%)";
             break;
          case "MODERN_COLOUR":
            transform =
              size === "large"
                ? "translate3d(11px, 26px, 0px) rotate(65deg)"
                : size === "small"
                ? "translate3d(9px, 24px, 0px) rotate(8deg)"
                : "translate3d(11px, 26px, 0px) rotate(65deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "28px" : "29px";
              clipPath =
              size === "large" ? "polygon(-27% 165px, 78% 9px, 52% -74%, 120% 92%, 77% 103%, 55% 100%, 73% 101%, -28% 83%, 11% 4px, 75% 29%)" : 
              size === "small" ? "" : "polygon(-27% 165px, 78% 9px, 52% -74%, 120% 92%, 77% 103%, 55% 100%, 73% 101%, -28% 83%, 11% 4px, 75% 29%)";
             break;
          case "BRUSHED":
            transform =
              size === "large"
                ? "translate3d(7px, 26px, 0px) rotate(83deg)"
                : size === "small"
                ? "translate3d(12px, 30px, 0px)"
                : "translate3d(8px, 26px, 0px) rotate(83deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "22px" : "32px";
              clipPath =
              size === "large" ? "polygon(-10% 86px, 78% -7px, 100% 42%, 100% 71%, 88% 94%, 55% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)" : 
              size === "small" ? "" : "polygon(0% 43px, 78% -7px, 100% 42%, 100% 71%, 88% 94%, 55% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)";
             break;
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(14px, 27px, 0px) rotate(-7deg)"
                : size === "small"
                ? "translate3d(20px, 22px, 0px) rotate(55deg)"
                : "translate3d(15px, 15px, 0px) rotate(67deg)";
  
            width =
              size === "large" ? "27px" : size === "small" ? "21px" : "28px";
              clipPath =
              size === "large" ? "polygon(19% 55px, 10% 34px, 100% 35%, 108% 78%, 103% 94%, 73% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)" : 
              size === "small" ? "" : "polygon(19% 55px, 10% 34px, 100% 35%, 108% 78%, 103% 94%, 73% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)";
             break;
          case "STUD":
            transform =
              size === "large"
                ? "translate3d(15px, 21px, 0px) rotate(19deg)"
                : size === "small"
                ? "translate3d(15px, 21px, 0px) rotate(19deg)"
                : "translate3d(15px, 21px, 0px) rotate(19deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(16px, 4px, 0px) rotate(202deg)"
                : size === "small"
                ? "translate3d(14px, 14px, 0px) rotate(225deg)"
                : "translate3d(14px, 14px, 0px) rotate(225deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "27px" : "28px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate3d(16px, 12px, 0px) rotate(81deg)"
                : size === "small"
                ? "translate3d(23px, 20px, 0px) rotate(64deg)"
                : "translate3d(23px, 20px, 0px) rotate(64deg)";
  
            width =
              size === "large" ? "28px" : size === "small" ? "22px" : "28px";
              clipPath =
              size === "large" ? "polygon(4% 194px, 5% 9px, 52% -74%, 120% 92%, 77% 103%, 55% 100%, 73% 101%, -28% 83%, 11% 4px, 75% 29%)" : 
              size === "small" ? "" : "polygon(4% 194px, 5% 9px, 52% -74%, 120% 92%, 77% 103%, 55% 100%, 73% 101%, -28% 83%, 11% 4px, 75% 29%)";
             break;
          default:
            transform =
              size === "large"
                ? "translate3d(10px, 20px, 0px) rotate(80deg)"
                : size === "small"
                ? "translate3d(17px, 20px, 0px) rotate(62deg)"
                : "translate3d(11px, 21px, 0px) rotate(75deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "20px" : "33px";
            // polygone =
            //   size === "large"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : size === "small"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)";
  
            clipPath =
            size === "large" ? "polygon(6% 2px, 58% 18px, 94% 24%, 100% 100%, 145% 100%, 74% 100%, 67% 97%, -88% 75%, 10% 3px, 66% 29%)" : 
            size === "small" ? " polygon(1% 37%, 49% 42%, 35% 0%, 100% 0px, 99% 19%, 100% 25%, 99% 50%, 100% 53%, 98% 99%, 0px 100%, 0px 53%, 0px 48%)" :
             "polygon(6% 2px, 58% 18px, 94% 24%, 100% 100%, 145% 100%, 74% 100%, 67% 97%, -88% 75%, 10% 3px, 66% 29%)";
           break;
        }
        break;
        case "DotE":
        switch (earringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(17px, 17px) rotate(-6deg)"
                : size === "small"
                ? "translate(17px, 17px) rotate(-6deg)"
                : "translate(17px, 17px) rotate(-6deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "27px" : "28px";
            break;
          case "DIAMONDCRAWLER":
            transform =
              size === "large"
                ? "translate(17px, 14px) rotate(200deg)"
                : size === "small"
                ? "translate(17px, 14px) rotate(200deg)"
                : "translate(17px, 14px) rotate(200deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "32px" : "30px";
            break;
          case "DIAMOND_CRAWLER":
            transform =
              size === "large"
                ? "translate(19px, 19px) rotate(164deg)"
                : size === "small"
                ? "translate(19px, 19px) rotate(164deg)"
                : "translate(19px, 19px) rotate(164deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "27px" : "28px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(-23px, 0px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 12px, 0px)"
                : "translate3d(-16px, 5px, 0px)";
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "MODERN_COLOUR":
            transform =
              size === "large"
                ? "translate3d(-23px, 12px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 24px, 0px)"
                : "translate3d(0px, 37px, 0px) rotate(8deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "28px" : "31px";
            break;
          case "BRUSHED":
            transform =
              size === "large"
                ? "translate3d(1px, 42px, 0px)"
                : size === "small"
                ? "translate3d(4px, 42px, 0px)"
                : "translate3d(4px, 42px, 0px)";
  
            width =
              size === "large" ? "36px" : size === "small" ? "22px" : "32px";
            break;
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(-20px, 6px, 0px)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "STUDSTAR":
            transform =
              size === "large"
                ? "translate3d(22px, 12px, 0px) rotate(-17deg)"
                : size === "small"
                ? "translate3d(22px, 12px, 0px) rotate(-17deg)"
                : "translate3d(22px, 12px, 0px) rotate(-17deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "27px";
            break;
          case "STUDMINI":
            transform =
              size === "large"
                ? "translate3d(19px, 24px, 0px) rotate(35deg)"
                : size === "small"
                ? "translate3d(19px, 24px, 0px) rotate(35deg)"
                : "translate3d(19px, 24px, 0px) rotate(35deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "30px";
            break;
          case "STUDMOON":
            transform =
              size === "large"
                ? "translate3d(21px, 11px, 0px) rotate(334deg)"
                : size === "small"
                ? "translate3d(21px, 11px, 0px) rotate(334deg)"
                : "translate3d(21px, 11px, 0px) rotate(334deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "STUDLIGHTNING":
            transform =
              size === "large"
                ? "translate3d(20px, 7px, 0px) rotate(314deg)"
                : size === "small"
                ? "translate3d(20px, 7px, 0px) rotate(314deg)"
                : "translate3d(20px, 7px, 0px) rotate(314deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(19px, -2px, 0px) rotate(341deg)"
                : size === "small"
                ? "translate3d(17px, 8px, 0px) rotate(352deg)"
                : "translate3d(14px, 14px, 0px) rotate(225deg)";
            width =
              size === "large" ? "27px" : size === "small" ? "30px" : "28px";
            break;
          case "Constellation":
            transform =
              size === "large"
                ? "translate3d(22px, 1px, 0px) rotate(337deg)"
                : size === "small"
                ? "translate3d(22px, 1px, 0px) rotate(337deg)"
                : "translate3d(22px, 1px, 0px) rotate(337deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "21px" : "28px";
            break;
          case "Star_Chain":
            transform =
              size === "large"
                ? "translate3d(20px, 4px, 0px) rotate(337deg)"
                : size === "small"
                ? "translate3d(20px, 4px, 0px) rotate(337deg)"
                : "translate3d(20px, 4px, 0px) rotate(337deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "21px" : "28px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate3d(4px, 31px, 0px) rotate(-16deg)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "27px" : size === "small" ? "22px" : "28px";
            break;
          default:
            transform =
              size === "large"
                ? "translate3d(15px, 29px, 0px) rotate(-42deg)"
                : size === "small"
                ? "translate3d(12px, 40px, 0px) rotate(-19deg)"
                : "translate3d(12px, 40px, 0px) rotate(-51deg)";
  
            width =
              size === "large" ? "26px" : size === "small" ? "20px" : "23px";
            // polygone =
            //   size === "large"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : size === "small"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)";
  
            break;
        }
        break;
        case "E1":
          switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(9px, 0px) rotate(0deg)"
                  : size === "small"
                  ? "translate(11px, 0px) rotate(0deg)"
                  : "translate(9px, 0px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "16px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(46% 0, 44% 36%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;    
              case  "ENTRANCING"  :
                transform =
                size === "large"
                  ? "translate(7px, 1px) rotate(0deg)"
                  : size === "small"
                  ? "translate(7px, 1px) rotate(0deg)"
                  : "translate(7px, 1px) rotate(0deg)";
              width =
                size === "large" ? "23px" : size === "small" ? "23px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(46% 0, 44% 36%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;   
              case  "CROSS"  :
                transform =
                size === "large"
                  ? "translate(11px, -2px) rotate(0deg)"
                  : size === "small"
                  ? "translate(11px, -2px) rotate(0deg)"
                  : "translate(11px, -2px) rotate(0deg)";
              width =
                size === "large" ? "19px" : size === "small" ? "19px" : "19px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(46% 0, 44% 36%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;  
              case  "PEACE"  :
                transform =
                size === "large"
                  ? "translate(15px, 4px) rotate(0deg)"
                  : size === "small"
                  ? "translate(15px, 4px) rotate(0deg)"
                  : "translate(15px, 4px) rotate(0deg)";
              width =
                size === "large" ? "19px" : size === "small" ? "19px" : "19px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(46% 0, 44% 36%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
                size === "large"
                  ? "translate(12px, 0px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 0px) rotate(0deg)"
                  : "translate(12px, 0px) rotate(0deg)";
              width =
                size === "large" ? "19px" : size === "small" ? "19px" : "19px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0 0, 26% 0, 19% 17%, 59% 13%, 100% 0, 100% 25%, 100% 50%, 100% 59%, 100% 100%, 0 100%, 0 66%, 0 45%)" 
                 :  ""
            break ;  
            case"PRECIOUS" :
            transform =
                size === "large"
                  ? "translate(13px, 0px) rotate(0deg)"
                  : size === "small"
                  ? "translate(13px, 0px) rotate(0deg)"
                  : "translate(13px, 0px) rotate(0deg)";
              width =
                size === "large" ? "17px" : size === "small" ? "16px" : "17px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0 0, 26% 0, 19% 17%, 59% 13%, 100% 0, 100% 25%, 100% 50%, 100% 59%, 100% 100%, 0 100%, 0 66%, 0 45%)" 
                 :  ""
          break ;      
          case"DARLING" :
          transform =
          size === "large"
            ? "translate(11px, 0px) rotate(0deg)"
            : size === "small"
            ? "translate(11px, 0px) rotate(0deg)"
            : "translate(11px, 0px) rotate(0deg)";
        width =
          size === "large" ? "19px" : size === "small" ? "16px" : "19px";
          clipPath =
          size === "large" ?
           "" :  size === "small" ?  "polygon(46% 0, 44% 36%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
           :  ""
        break ; 
        case"MARVELOUS" :
        transform =
          size === "large"
            ? "translate(8px, 1px) rotate(0deg)"
            : size === "small"
            ? "translate(8px, 1px) rotate(0deg)"
            : "translate(8px, 1px) rotate(0deg)";
        width =
          size === "large" ? "19px" : size === "small" ? "19px" : "19px";
          clipPath =
          size === "large" ?
           "" :  size === "small" ?  "polygon(46% 0, 44% 36%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
           :  ""
      break ;  
      case"PLANET" :
      transform =
          size === "large"
            ? "translate(7px, -1px) rotate(0deg)"
            : size === "small"
            ? "translate(7px, -1px) rotate(0deg)"
            : "translate(7px, -1px) rotate(0deg)";
        width =
          size === "large" ? "17px" : size === "small" ? "24px" : "17px";
          clipPath =
          size === "large" ?
           "" :  size === "small" ?  "polygon(46% 0, 44% 36%, 97% 1%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
           :  ""
    break ;      
    case"PEACESIGN" :
    transform =
    size === "large"
      ? "translate(7px, 0px) rotate(0deg)"
      : size === "small"
      ? "translate(7px, 0px) rotate(0deg)"
      : "translate(7px, 0px) rotate(0deg)";
  width =
    size === "large" ? "24px" : size === "small" ? "24px" : "24px";
    clipPath =
    size === "large" ?
     "" :  size === "small" ?  "polygon(0 23%, 0 0, 41% 0, 54% 16%, 100% 0, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
     :  ""
  break ;  
  case"HAND" :
  transform =
  size === "large"
    ? "translate(7px, 0px) rotate(0deg)"
    : size === "small"
    ? "translate(7px, 0px) rotate(0deg)"
    : "translate(7px, 0px) rotate(0deg)";
  width =
  size === "large" ? "19px" : size === "small" ? "24px" : "19px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 41% 0, 54% 16%, 100% 0, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ; 
  case"CELESTIAL" :
  transform =
  size === "large"
    ? "translate(9px, 0px) rotate(0deg)"
    : size === "small"
    ? "translate(9px, 0px) rotate(0deg)"
    : "translate(9px, 0px) rotate(0deg)";
  width =
  size === "large" ? "20px" : size === "small" ? "20px" : "20px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 41% 0, 54% 16%, 100% 0, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ;  
  case"SUMMER" :
  transform =
  size === "large"
    ? "translate(15px, 7px) rotate(0deg)"
    : size === "small"
    ? "translate(9px, 2px) rotate(0deg)"
    : "translate(9px, 2px) rotate(0deg)";
  width =
  size === "large" ? "19px" : size === "small" ? "19px" : "19px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "  polygon(0 25%, 0 0, 28% 1%, 57% 21%, 74% 7%, 100% 29%, 100% 55%, 100% 76%, 100% 100%, 0 100%, 0 63%, 0 38%)" 
   :  ""
  break ;   
          }
          break;
        case "C":
        case "C1" :
        switch (circleEarringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(12px, 20px) rotate(14deg)"
                : size === "small"
                ? "translate(12px, 20px) rotate(14deg)"
                : "translate(12px, 20px) rotate(14deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "27px" : "28px";
            break;
          case "KNIFE_EDGED":
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(6px, 1px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 23%, 94% 15%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(2px, 1px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "28px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 23%, 94% 15%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(8px, -4px) rotate(0deg)"
                  : size === "small"
                  ? "translate(7px, 1.5px) rotate(0deg)"
                  : "translate(8px, -4px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "16px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0px 0px, 55% 0px, 34% 12%, 55% 32%, 90% 13%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(2px, 1px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "28px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 18%, 94% 15%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(12px, 0px) rotate(0deg)"
                : size === "small"
                ? "translate(6px, 0px) rotate(10deg)"
                : "translate(12px, 0px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "26px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 20% 0px, 27% 18%, 73% 10%, 100% 0px, 100% 25%, 100% 50%, 100% 59%, 100% 100%, 0px 100%, 0px 66%, 0px 45%)" 
               :  ""
            break ;  
              case"PRECIOUS" :
            transform =
            size === "large"
              ? "translate(12px, 1px) rotate(2deg)"
              : size === "small"
              ? "translate(10px, 1px) rotate(1deg)"
              : "translate(12px, 1px) rotate(2deg)";
          width =
            size === "large" ? "18px" : size === "small" ? "16px" : "18px";
            clipPath =
            size === "large" ?
             "" :  size === "small" ?  "polygon(0px 0px, 32% 0px, 19% 13%, 70% 29%, 89% -4%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0px 50%)" 
             :  ""
          break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(10px, 1px) rotate(1deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "16px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 32% 0, 19% 13%, 63% 16%, 91% 5%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
        break ; 
              case"MARVELOUS" :
              transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(1px, 0px) rotate(5deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "28px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 23%, 94% 15%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
      break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(1px, 0px) rotate(5deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "28px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 23%, 94% 15%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
    break ;      
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(2px, 1px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "28px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 18%, 94% 15%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
              break ;   
              case"HAND" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(2px, 1px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "28px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 18%, 94% 15%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
  break ;
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(8px, -4px) rotate(0deg)"
                : size === "small"
                ? "translate(6px, -0px) rotate(0deg)"
                : "translate(8px, -4px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "20px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 55% 0px, 34% 12%, 55% 24%, 90% 13%, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 49%)" 
               :  ""
  break ; 
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(0px, 2px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "28px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 18%, 94% 15%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
                break ;     
              default : 
              transform =
              size === "large"
                ? "translate3d(-3px, 28px, 0px) rotate(123deg)"
                : size === "small"
                ? "translate3d(7px, 12px, 0px)"
                : "translate3d(-3px, 28px, 0px) rotate(123deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "54px";
            break;
          }
           break;
           
          case "MODERN_COLOUR":
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, 3px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 5% 20%, 41% 39%, 62% 14%, 54% 0, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(13px, 3px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "30px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 20% 21%, 50% 39%, 62% 14%, 44% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(8px, -4px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, 3px) rotate(0deg)"
                  : "translate(8px, -4px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "22px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0px 0px, 10% 7%, 34% 24%, 65% 10%, 58% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(13px, 3px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "30px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 20% 21%, 56% 24%, 62% 14%, 46% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(12px, 0px) rotate(0deg)"
                : size === "small"
                ? "translate(18px, 3px) rotate(0deg)"
                : "translate(12px, 0px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "27px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 7% 23%, 27% 19%, 42% 9%, 31% 0px, 100% 0px, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
            break ;  
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, 2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "16px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 0 19%, 28% 28%, 66% 11%, 43% 0, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
          break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, 2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "16px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 0 19%, 28% 28%, 66% 11%, 43% 0, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
        break ; 
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 20% 21%, 46% 22%, 62% 14%, 44% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
              break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 20% 21%, 46% 26%, 62% 14%, 44% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
                break ;      
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 20% 21%, 56% 24%, 62% 14%, 46% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
  break ;   
              case"HAND" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 20% 21%, 56% 24%, 62% 14%, 46% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
  break ;
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(8px, -4px) rotate(0deg)"
                : size === "small"
                ? "translate(15px, 4px) rotate(0deg)"
                : "translate(8px, -4px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "22px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 10% 7%, 34% 20%, 65% 10%, 58% 0px, 100% 0px, 100% 51%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 50%)" 
               :  ""
  break ; 
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 3px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 20% 21%, 56% 24%, 62% 14%, 46% 0px, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 52%)" 
               :  ""
        break ;     
              default : 
              transform =
              size === "large"
                ? "translate3d(2px, 15px, 0px) rotate(69deg)"
                : size === "small"
                ? "translate3d(9px, 15px, 0px) rotate(1deg)"
                : "translate3d(2px, 15px, 0px) rotate(69deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "22px" : "38px";
              clipPath =
              size === "large" ? "polygon(0 21%, 0 0, 76% 0, 68% 68%, 100% 68%, 100% 26%, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 52%)" : 
              size === "small" ? "" : "polygon(0 21%, 0 0, 76% 0, 68% 63%, 100% 62%, 100% 26%, 100% 52%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 52%)";
             break;
          }
         break;     
          case "BRUSHED":
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(10px, -3px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 48% 0, 33% 16%, 68% 25%, 82% 6%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(4.5px, -3px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "30px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 48% 0, 33% 16%, 68% 25%, 82% 6%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(8px, -4px) rotate(0deg)"
                  : size === "small"
                  ? "translate(8px, -3px) rotate(0deg)"
                  : "translate(8px, -4px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "22px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0 0, 52% 0, 30% 19%, 67% 18%, 78% 8%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(10px, 6px) rotate(0deg)"
                  : size === "small"
                  ? "translate(6.5px, -3px) rotate(0deg)"
                  : "translate(10px, 6px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "26px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(49% 0px, 3% 0px, 0px 55%, -2% 65%, 3px 98%, 45% 99%, 100% 100%, 100% 80%, 100% 50%, 100% 20%, 81% 21%, 53% 26%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(12px, 0px) rotate(0deg)"
                : size === "small"
                ? "translate(11px, -1px) rotate(0deg)"
                : "translate(12px, 0px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "22px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 20% 0px, 27% 18%, 73% 10%, 100% 0px, 100% 25%, 100% 50%, 100% 59%, 100% 100%, 0px 100%, 0px 66%, 0px 45%)" 
               :  ""
            break ;  
              case"PRECIOUS" :
            transform =
            size === "large"
              ? "translate(12px, 1px) rotate(2deg)"
              : size === "small"
              ? "translate(9px, -4px) rotate(2deg)"
              : "translate(12px, 1px) rotate(2deg)";
          width =
            size === "large" ? "18px" : size === "small" ? "16px" : "18px";
            clipPath =
            size === "large" ?
             "" :  size === "small" ?  "polygon(0 0, 64% 0, 42% 11%, 72% 29%, 96% 16%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
             :  ""
          break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(9px, -4px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "16px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 64% 0, 42% 11%, 72% 29%, 96% 16%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
        break ; 
              case"MARVELOUS" :
        transform =
        size === "large"
          ? "translate(7.2px, -3px) rotate(0deg)"
          : size === "small"
          ? "translate(5px, -3.5px) rotate(0deg)"
          : "translate(7.2px, -3px) rotate(0deg)";
      width =
        size === "large" ? "22px" : size === "small" ? "28px" : "22px";
        clipPath =
        size === "large" ?
         "" :  size === "small" ?  "polygon(49% 0px, 25% 1px, -6px 44%, 0% 53%, -3px 98%, 54% 100%, 100% 100%, 100% 80%, 100% 50%, 100% 20%, 81% 21%, 53% 26%)" 
         :  ""
      break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(7.2px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(5px, -3.5px) rotate(0deg)"
                : "translate(7.2px, -3px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "28px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(49% 0px, 25% 1px, -6px 44%, 0% 53%, -3px 98%, 54% 100%, 100% 100%, 100% 80%, 100% 50%, 100% 20%, 81% 21%, 53% 26%)" 
               :  ""
    break ;      
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(10px, 6px) rotate(0deg)"
                : size === "small"
                ? "translate(6.5px, -3px) rotate(0deg)"
                : "translate(10px, 6px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "26px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(49% 0px, 3% 0px, 0px 55%, -2% 65%, 3px 98%, 45% 99%, 100% 100%, 100% 80%, 100% 50%, 100% 20%, 81% 21%, 53% 26%)" 
               :  ""
  break ;   
              case"HAND" :
              transform =
              size === "large"
                ? "translate(10px, 6px) rotate(0deg)"
                : size === "small"
                ? "translate(6.5px, -3px) rotate(0deg)"
                : "translate(10px, 6px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "26px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(49% 0px, 3% 0px, 0px 55%, -2% 65%, 3px 98%, 45% 99%, 100% 100%, 100% 80%, 100% 50%, 100% 20%, 81% 21%, 53% 26%)" 
               :  ""
  break ;
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(8px, -4px) rotate(0deg)"
                : size === "small"
                ? "translate(8px, -3px) rotate(0deg)"
                : "translate(8px, -4px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "22px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 52% 0, 30% 19%, 67% 18%, 78% 8%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)" 
               :  ""
  break ; 
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(10px, 6px) rotate(0deg)"
                : size === "small"
                ? "translate(6.5px, -3px) rotate(0deg)"
                : "translate(10px, 6px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "26px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(49% 0px, 3% 0px, 0px 55%, -2% 65%, 3px 98%, 45% 99%, 100% 100%, 100% 80%, 100% 50%, 100% 20%, 81% 21%, 53% 26%)" 
               :  ""
  break ;     
              default : 
  transform =
  size === "large"
    ? "translate3d(-4px, 18px, 0px) rotate(95deg)"
    : size === "small"
    ? "translate3d(-2px, 45px, 0px) rotate(14deg)"
    : "translate3d(-7px, 28px, 0px) rotate(119deg)";
  
  width =
  size === "large" ? "48px" : size === "small" ? "22px" : "48px";
  clipPath =
  size === "large" ? "polygon(0 25%, 0 0, 35% 0%, 63% 59%, 90% 40%, 100% 21%, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)" : 
  size === "small" ? "" : "polygon(-10% 86px, 78% -7px, 100% 42%, 100% 71%, 88% 94%, 55% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)";
  break;
          }
         break;
          case "SIMPLE_HOOP":
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(19px, -2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 61% 1%, 41% 8%, 65% 25%, 90% 14%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, -1px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 61% 1%, 41% 8%, 65% 25%, 90% 14%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(20px, -1px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "15px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 61% 1%, 41% 8%, 65% 25%, 90% 14%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, -2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "25px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 61% 1%, 41% 8%, 65% 25%, 90% 14%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -2px) rotate(11deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 51% 0, 28% 6%, 37% 18%, 65% 13%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
            break ;  
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, -2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "16px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 65% 0px, 36% 11%, 74% 20%, 87% 12%, 100% 6px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0px 50%)" 
               :  ""
          break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, -2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "16px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 65% 0, 36% 11%, 74% 20%, 100% 10%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
        break ; 
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -1px) rotate(3deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 61% 1%, 41% 8%, 65% 19%, 86% 4%, 105% 15px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -1px) rotate(3deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 61% 1%, 41% 8%, 65% 19%, 86% 4%, 105% 15px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
                break ;      
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(16px, -2px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 61% 1%, 41% 8%, 65% 25%, 90% 14%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
  break ;   
              case"HAND" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, -1px) rotate(3deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 61% 1%, 41% 8%, 65% 19%, 86% 4%, 105% 15px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
                break ;
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(14px, -2px) rotate(1deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "25px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 61% 1%, 41% 8%, 65% 19%, 86% 4%, 105% 15px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
                break ; 
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(11px, -2px) rotate(1deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 61% 1%, 41% 8%, 61% 19%, 71% 11%, 105% -5px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;     
              default : 
              transform =
              size === "large"
                ? "translate3d(3px, 21px, 0px) rotate(295deg)"
                : size === "small"
                ? "translate3d(3px, 21px, 0px) rotate(295deg)"
                : "translate3d(5px, 17px, 0px) rotate(273deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "37px" : "38px";
              clipPath =
              size === "large" ? "polygon(72% 55px, 82% 18px, 25% 57%, 253% 75%, 104% 97%, 90% 100%, 43% 100%, -13% 79%, -7% -2px, 89% 4%)" : 
              size === "small" ? "" : " polygon(38% 0, 55% 11%, 24% 25%, 51% 38%, 100% 0, 100% 26%, 100% 46%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 0)";
             break;
          }
         break;  
         
          case "STUD":
            transform =
              size === "large"
                ? "translate3d(12px, 28px, 0px) rotate(44deg)"
                : size === "small"
                ? "translate3d(12px, 28px, 0px) rotate(44deg)"
                : "translate3d(12px, 28px, 0px) rotate(44deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(16px, 7px, 0px) rotate(-111deg)"
                : size === "small"
                ? "translate3d(16px, 7px, 0px) rotate(-111deg)"
                : "translate3d(16px, 7px, 0px) rotate(-111deg)";
            width =
              size === "large" ? "31px" : size === "small" ? "31px" : "31px";
            break;
          case "TWISTED_GOLD":
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(10px, -16px) rotate(-2deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "20px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 53% 0, 37% 12%, 62% 23%, 87% 11%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(6px, -16px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "30px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 48% 0, 33% 16%, 68% 25%, 82% 6%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(8px, -4px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, -15.5px) rotate(-2deg)"
                  : "translate(8px, -4px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "16px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(0 0, 55% 0, 34% 10%, 58% 20%, 88% 13%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 49%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(10px, 6px) rotate(0deg)"
                  : size === "small"
                  ? "translate(7.5px, -17px) rotate(0deg)"
                  : "translate(10px, 6px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "26px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(49% 0px, 3% 0px, 0px 55%, -2% 65%, 3px 98%, 45% 99%, 100% 100%, 100% 80%, 100% 50%, 100% 20%, 81% 21%, 53% 26%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(12px, 0px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -15px) rotate(0deg)"
                : "translate(12px, 0px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "25px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 20% 0px, 27% 18%, 73% 10%, 100% 0px, 100% 25%, 100% 50%, 100% 59%, 100% 100%, 0px 100%, 0px 66%, 0px 45%)" 
               :  ""
            break ;  
              case"PRECIOUS" :
            transform =
            size === "large"
              ? "translate(12px, 1px) rotate(2deg)"
              : size === "small"
              ? "translate(15px, -16px) rotate(-3deg)"
              : "translate(12px, 1px) rotate(2deg)";
          width =
            size === "large" ? "18px" : size === "small" ? "16px" : "18px";
            clipPath =
            size === "large" ?
             "" :  size === "small" ?  "polygon(0 0, 32% 0, 19% 13%, 70% 16%, 80% 2%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
             :  ""
          break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(15px, -16px) rotate(-3deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "16px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 32% 0, 19% 13%, 70% 16%, 80% 2%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
        break ; 
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(6px, -16px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 48% 0, 33% 16%, 68% 25%, 82% 6%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
      break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(6px, -16px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 48% 0, 33% 16%, 68% 25%, 82% 6%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
    break ;      
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(10px, 6px) rotate(0deg)"
                : size === "small"
                ? "translate(7.5px, -17px) rotate(0deg)"
                : "translate(10px, 6px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "26px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(49% 0px, 3% 0px, 0px 55%, -2% 65%, 3px 98%, 45% 99%, 100% 100%, 100% 80%, 100% 50%, 100% 20%, 81% 21%, 53% 26%)" 
               :  ""
              break ;   
              case"HAND" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(6px, -16px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 48% 0, 33% 16%, 68% 25%, 82% 6%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
  break ;
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(8px, -4px) rotate(0deg)"
                : size === "small"
                ? "translate(8px, -18px) rotate(0deg)"
                : "translate(8px, -4px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "25px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 52% 0, 30% 19%, 67% 18%, 78% 8%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)" 
               :  ""
  break ; 
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(8px, -4px) rotate(0deg)"
                : size === "small"
                ? "translate(6px, -17px) rotate(0deg)"
                : "translate(8px, -4px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "30px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 52% 0px, 30% 36%, 70% 18%, 78% 8%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 48%)" 
               :  ""
                break ;     
              default : 
              transform =
              size === "large"
                ? "translate3d(-1px, 16px, 0px) rotate(137deg)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "55px" : size === "small" ? "22px" : "28px";
              clipPath =
              size === "large" ? "polygon(0 20%, 0 0, 30% 0, 100% 0, 100% 61%, 63% 47%, 72% 1%, 100% 62%, 100% 100%, 0 99%, 0 62%, 0 51%)" : 
              size === "small" ? "" : "polygon(-10% 86px, 78% -7px, 100% 42%, 100% 71%, 88% 94%, 55% 100%, 27% 97%, -88% 75%, 10% 3px, 66% 29%)";
             break;
          }
           break;
  
          default:
            switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, 2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "23px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 74% 0, 44% 11%, 65% 35%, 91% 31%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;    
              case  "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(14px, 2px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "30px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0, 74% 0, 44% 11%, 65% 35%, 91% 31%, 100% 0, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
                 :  ""
              break ;   
              case  "CROSS" :
                transform =
                size === "large"
                  ? "translate(8px, -4px) rotate(0deg)"
                  : size === "small"
                  ? "translate(16px, 2px) rotate(0deg)"
                  : "translate(8px, -4px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "25px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  " polygon(0 0, 67% 0, 35% 10%, 57% 30%, 89% 24%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)" 
                 :  ""
              break ;     
              case  "PEACE" :
                transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(13px, 4px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "30px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(2% 0px, 59% 0px, 44% 11%, 65% 27%, 91% 7%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
                 :  ""
              break ; 
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(12px, 0px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 3px) rotate(14deg)"
                : "translate(12px, 0px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "30px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0, 27% 0, 25% 9%, 42% 17%, 61% 11%, 100% 0, 100% 50%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 51%)" 
               :  ""
            break ;  
              case"PRECIOUS" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, 2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "17px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0px 0px, 69% 1%, 25% 14%, 47% 35%, 104% 25%, 100% 0px, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0px 50%)" 
               :  ""
          break ;      
              case"DARLING" :
              transform =
              size === "large"
                ? "translate(12px, 1px) rotate(2deg)"
                : size === "small"
                ? "translate(18px, 2px) rotate(2deg)"
                : "translate(12px, 1px) rotate(2deg)";
            width =
              size === "large" ? "18px" : size === "small" ? "17px" : "18px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 85% 1%, 31% 12%, 53% 35%, 100% 31%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 1% 100%, 0 50%)" 
               :  ""
        break ; 
              case"MARVELOUS" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 4px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 59% 0px, 44% 11%, 65% 27%, 91% 7%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
              break ;  
              case"PLANET" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 4px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 59% 0px, 44% 11%, 65% 27%, 91% 7%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
                break ;      
              case"PEACESIGN" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 4px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "30px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 59% 0px, 44% 11%, 65% 27%, 91% 7%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
  break ;   
              case"HAND" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(10px, 4px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "33px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 59% 0px, 44% 11%, 65% 27%, 91% 7%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
  break ;
              case"CELESTIAL" :
              transform =
              size === "large"
                ? "translate(8px, -4px) rotate(0deg)"
                : size === "small"
                ? "translate(13px, 3px) rotate(0deg)"
                : "translate(8px, -4px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "27px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  " polygon(0 0, 67% 0, 35% 10%, 57% 30%, 89% 24%, 100% 0, 100% 49%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 48%)" 
               :  ""
  break ; 
              case"SUMMER" :
              transform =
              size === "large"
                ? "translate(11px, -3px) rotate(0deg)"
                : size === "small"
                ? "translate(9px, 4px) rotate(0deg)"
                : "translate(11px, -3px) rotate(0deg)";
            width =
              size === "large" ? "24px" : size === "small" ? "35px" : "23px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(2% 0px, 59% 0px, 44% 11%, 65% 27%, 91% 7%, 100% 0px, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0px 100%, 0px 51%)" 
               :  ""
        break ;     
              default : 
              transform =
              size === "large"
                ? "translate3d(12px, 27px, 0px) rotate(101deg)"
                : size === "small"
                ? "translate3d(11px, 14px, 0px) rotate(245deg)"
                : "translate3d(12px, 27px, 0px) rotate(101deg)";
  
            width =
              size === "large" ? "43px" : size === "small" ? "30px" : "43px";
              clipPath =
              size === "large" ? "polygon(0 20%, 0 0, 35% 0%, 65% 0%, 42% 11%, 66% 71%, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)" : 
              size === "small" ? " polygon(0 25%, 0 0, 35% 0%, 100% 0, 100% 29%, 42% 32%, 49% 44%, 100% 45%, 100% 96%, 35% 100%, 0 100%, 0 53%)" 
              : "polygon(0 20%, 0 0, 35% 0%, 65% 0%, 42% 11%, 66% 71%, 100% 53%, 100% 100%, 65% 100%, 35% 100%, 0 100%, 0 50%)";
             break;
          }
         break;
       
        }
        break;
        case "DotC":
        switch (earringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(12px, 20px) rotate(-24deg)"
                : size === "small"
                ? "translate(12px, 20px) rotate(-24deg)"
                : "translate(12px, 20px) rotate(-24deg)";
            width =
              size === "large" ? "36px" : size === "small" ? "31px" : "33px";
            break;
          case "DIAMONDCRAWLER":
            transform =
              size === "large"
                ? "translate(5px, 12px) rotate(170deg)"
                : size === "small"
                ? "translate(5px, 12px) rotate(170deg)"
                : "translate(5px, 12px) rotate(170deg)";
            width =
              size === "large" ? "36px" : size === "small" ? "33px" : "33px";
            break;
          case "DIAMOND_CRAWLER":
            transform =
              size === "large"
                ? "translate(12px, 20px) rotate(15deg)"
                : size === "small"
                ? "translate(12px, 20px) rotate(15deg)"
                : "translate(12px, 20px) rotate(15deg)";
            width =
              size === "large" ? "36px" : size === "small" ? "31px" : "33px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(-23px, 0px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 12px, 0px)"
                : "translate3d(-16px, 5px, 0px)";
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "MODERN_COLOUR":
            transform =
              size === "large"
                ? "translate3d(-23px, 12px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 24px, 0px)"
                : "translate3d(15px, 22px, 0px) rotate(1deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "22px" : "38px";
            break;
          case "BRUSHED":
            transform =
              size === "large"
                ? "translate3d(25px, 11px, 0px) rotate(54deg)"
                : size === "small"
                ? "translate3d(27px, 12px, 0px) rotate(59deg)"
                : "translate3d(27px, 12px, 0px) rotate(59deg)";
  
            width =
              size === "large" ? "36px" : size === "small" ? "22px" : "32px";
            break;
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(-20px, 6px, 0px)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            break;
          case "STUDSTAR":
            transform =
              size === "large"
                ? "translate3d(12px, 19px, 0px) rotate(316deg)"
                : size === "small"
                ? "translate3d(12px, 19px, 0px) rotate(316deg)"
                : "translate3d(12px, 19px, 0px) rotate(316deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "27px";
            break;
          case "STUDLIGHTNING":
            transform =
              size === "large"
                ? "translate3d(10px, 6px, 0px) rotate(101deg)"
                : size === "small"
                ? "translate3d(10px, 6px, 0px) rotate(101deg)"
                : "translate3d(10px, 6px, 0px) rotate(101deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "STUDMINI":
            transform =
              size === "large"
                ? "translate3d(12px, 19px, 0px) rotate(44deg)"
                : size === "small"
                ? "translate3d(12px, 19px, 0px) rotate(44deg)"
                : "translate3d(12px, 19px, 0px) rotate(44deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "30px";
            break;
          case "STUDMOON":
            transform =
              size === "large"
                ? "translate3d(11px, 20px, 0px) rotate(330deg)"
                : size === "small"
                ? "translate3d(11px, 20px, 0px) rotate(330deg)"
                : "translate3d(11px, 20px, 0px) rotate(330deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(7px, -1px, 0px) rotate(322deg)"
                : size === "small"
                ? "translate3d(5px, 7px, 0px) rotate(333deg)"
                : "translate3d(16px, 7px, 0px) rotate(-111deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "30px" : "31px";
            break;
          case "Constellation":
            transform =
              size === "large"
                ? "translate3d(16px, 7px, 0px) rotate(-111deg)"
                : size === "small"
                ? "translate3d(16px, 7px, 0px) rotate(318deg)"
                : "translate3d(16px, 7px, 0px) rotate(-111deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "21px" : "31px";
            break;
          case "Star_Chain":
            transform =
              size === "large"
                ? "translate3d(8px, 7px, 0px) rotate(313deg)"
                : size === "small"
                ? "translate3d(8px, 7px, 0px) rotate(313deg)"
                : "translate3d(8px, 7px, 0px) rotate(313deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "21px" : "31px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate3d(16px, 1px, 0px) rotate(195deg)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "52px" : size === "small" ? "22px" : "28px";
            break;
          default:
            transform =
              size === "large"
                ? "translate3d(20px, 5px, 0px) rotate(126deg)"
                : size === "small"
                ? "translate3d(29px, 5px, 0px) rotate(126deg)"
                : "translate3d(27px, 3px, 0px) rotate(126deg)";
  
            width =
              size === "large" ? "35px" : size === "small" ? "25px" : "30px";
            break;
        }
        break;
        case "F":
        switch (earringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(10px, 14px) rotate(86deg)"
                : size === "small"
                ? "translate(10px, 14px) rotate(86deg)"
                : "translate(10px, 14px) rotate(86deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "27px" : "28px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(25px, -1px, 0px) rotate(333deg)"
                : size === "small"
                ? "translate3d(-1px, 1px, 0px) rotate(1deg)"
                : "translate3d(12px, -1px, 0px) rotate(347deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "22px";
            clipPath =
              size === "large"
                ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
                : size === "small"
                ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 84.37% 95.29%, 47% 87%, 2% 98%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)"
                : "polygon(0 21%, 0 0, 35% 0%, 100% 0, 100% 0, 53% 49%, 100% 42%, 100% 62%, 100% 100%, 0 99%, 0 61%, 0 48%)";
  
            break;
          case "MODERN_COLOUR":
            transform =
              size === "large"
                ? "translate3d(5px, 6px, 0px) rotate(5deg)"
                : size === "small"
                ? "translate3d(5px, 6px, 0px) rotate(5deg)"
                : "translate3d(11px, -3px, 0px) rotate(-10deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "22px" : "31px";
  
            // polygone =
            //   size === "large"
            //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 70.37% 85.29%, 148% 115%, 27% 115%, 1% 87%, 8% 82%, -24px 56%, 6px 0px)"
            //     : size === "small"
            //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 84.37% 95.29%, 47% 87%, 2% 98%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)"
            //     : "polygon(157% 9px, 91.98% 23.55%, 38.91% 29.77%, 77.37% 95.29%, 101% 104%, 21% 100%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)";
            clipPath =
              size === "large" ? "polygon(73% 72px, 87% -49px, 36% 39%, 253% 75%, 104% 97%, 91% 100%, 55% 99%, -1% 91%, -1% -2px, 110% 6%)" : 
              size === "small" ? "" : "polygon(73% 72px, 87% -49px, 36% 39%, 253% 75%, 104% 97%, 91% 100%, 55% 99%, -1% 91%, -1% -2px, 110% 6%)";
             break;
          case "BRUSHED":
            transform =
              size === "large"
                ? "translate3d(13px, -7px, 0px)"
                : size === "small"
                ? "translate3d(8px, -2px, 0px)"
                : "translate3d(13px, -7px, 0px)";
  
            width =
              size === "large" ? "24px" : size === "small" ? "22px" : "22px";
            // polygone =
            //   size === "large"
            //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 70.37% 85.29%, 148% 115%, 27% 115%, 1% 87%, 8% 82%, -24px 56%, 6px 0px)"
            //     : size === "small"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)";
  
            clipPath =
              size === "large" ? "polygon(52% 33px, 100% 23px, 100% 42%, 100% 71%, 88% 94%, 58% 108%, 29% 93%, -52% 75%, 10% 3px, 66% 29%)" : 
              size === "small" ? "" : "polygon(52% 33px, 100% 23px, 100% 42%, 100% 71%, 88% 94%, 58% 108%, 29% 93%, -52% 75%, 10% 3px, 66% 29%)";
             break;
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(14px, 1px, 0px) rotate(349deg)"
                : size === "small"
                ? "translate3d(24px, -2px, 0px) rotate(349deg)"
                : "translate3d(14px, 1px, 0px) rotate(349deg)";
  
            width =
              size === "large" ? "16px" : size === "small" ? "18px" : "21px";
            clipPath =
              size === "large"
                ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
                : size === "small"
                ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
                : "polygon(0 21%, 0 0, 35% 0%, 100% 0, 100% 0, 63% 47%, 100% 42%, 100% 62%, 100% 100%, 0 99%, 0 62%, 0 51%)";
  
            break;
  
          case "STUD":
            transform =
              size === "large"
                ? "translate3d(12px, 20px, 0px) rotate(19deg)"
                : size === "small"
                ? "translate3d(12px, 20px, 0px) rotate(19deg)"
                : "translate3d(12px, 20px, 0px) rotate(19deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(5px, 4px, 0px) rotate(214deg)"
                : size === "small"
                ? "translate3d(5px, 4px, 0px) rotate(214deg)"
                : "translate3d(5px, 4px, 0px) rotate(214deg)";
            width =
              size === "large" ? "32px" : size === "small" ? "32px" : "32px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate(14px, -3px) rotate(-3deg)"
                : size === "small"
                ? "translate3d(8px, -4px, 0px) rotate(9deg)"
                : "translate3d(8px, -4px, 0px) rotate(9deg)";
  
            width =
              size === "large" ? "20px" : size === "small" ? "22px" : "28px";
              clipPath =
              size === "large" ? "polygon(0 21%, 0 0, 35% 0%, 100% 0, 100% 0, 100% 29%, 100% 42%, 100% 62%, 100% 100%, 0 99%, 0 62%, 36% 62%)" : 
              size === "small" ? "" : "polygon(0 21%, 0 0, 35% 0%, 100% 0, 100% 0, 100% 29%, 100% 42%, 100% 62%, 100% 100%, 0 99%, 0 61%, 36% 60%)";
             break;
          default:
            transform =
              size === "large"
                ? "translate(13px, -6px) rotate(-18deg)"
                : size === "small"
                ? "translate(11px, 3px) rotate(-7deg)"
                : "translate(13px, -1px) rotate(-20deg)";
  
            width =
              size === "large" ? "29px" : size === "small" ? "20px" : "25px";
              clipPath =
              size === "large" ? "polygon(0 16%, 0 0, 35% 0%, 65% 0%, 49% 44%, 100% 44%, 100% 66%, 100% 72%, 100% 100%, 0 100%, 0 54%, 0 35%)" : 
              size === "small" ? "polygon(49% 52%, 50% 17%, 22% 0, 100% 0, 100% 61%, 63% 47%, 72% 1%, 100% 62%, 100% 100%, 0 99%, 0 62%, 1% 62%)"
               : "polygon(0 16%, 0 0, 35% 0%, 65% 0%, 49% 44%, 100% 44%, 100% 66%, 100% 72%, 100% 100%, 0 100%, 0 54%, 0 35%)";
             break;
        }
        break;
        case "DotF":
        switch (earringType) {
          case "CRAWLER":
            transform =
              size === "large"
                ? "translate(3px, 8px) rotate(42deg)"
                : size === "small"
                ? "translate(10px, 8px) rotate(-45deg)"
                : "translate(3px, 8px) rotate(42deg)";
            width =
              size === "large" ? "36px" : size === "small" ? "32px" : "34px";
            break;
          case "DIAMONDCRAWLER":
            transform =
              size === "large"
                ? "translate(5px, 9px) rotate(197deg)"
                : size === "small"
                ? "translate(5px, 9px) rotate(197deg)"
                : "translate(5px, 9px) rotate(197deg)";
            width =
              size === "large" ? "36px" : size === "small" ? "32px" : "34px";
            break;
          case "DIAMOND_CRAWLER":
            transform =
              size === "large"
                ? "translate(0px, 18px) rotate(169deg)"
                : size === "small"
                ? "translate(0px, 18px) rotate(169deg)"
                : "translate(0px, 18px) rotate(169deg)";
            width =
              size === "large" ? "36px" : size === "small" ? "32px" : "34px";
            break;
          case "KNIFE_EDGED":
            transform =
              size === "large"
                ? "translate3d(-23px, 0px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 12px, 0px)"
                : "translate3d(-16px, 5px, 0px)";
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            // polygone =
            //   size === "large"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : size === "small"
            //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 84.37% 95.29%, 47% 87%, 2% 98%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)"
            //     : "polygon(157% 9px, 91.98% 23.55%, 38.91% 29.77%, 77.37% 95.29%, 101% 104%, 21% 100%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)";
  
            break;
          case "MODERN_COLOUR":
            transform =
              size === "large"
                ? "translate3d(-23px, 12px, 0px)"
                : size === "small"
                ? "translate3d(-22px, 24px, 0px)"
                : "translate3d(-9px, 2px, 0px) rotate(-2deg)";
  
            width =
              size === "large" ? "34px" : size === "small" ? "22px" : "28px";
            // polygone =
            //   size === "large"
            //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 70.37% 85.29%, 148% 115%, 27% 115%, 1% 87%, 8% 82%, -24px 56%, 6px 0px)"
            //     : size === "small"
            //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 84.37% 95.29%, 47% 87%, 2% 98%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)"
            //     : "polygon(157% 9px, 91.98% 23.55%, 38.91% 29.77%, 77.37% 95.29%, 101% 104%, 21% 100%, 1% 84%, 8% 82%, -24px 56%, 6px 0px)";
  
            break;
          case "BRUSHED":
            transform =
              size === "large"
                ? "translate3d(8px, -2px, 0px)"
                : size === "small"
                ? "translate3d(8px, -2px, 0px)"
                : "translate3d(8px, 4px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "22px";
            // polygone =
            //   size === "large"
            //     ? "polygon(157% 9px, 100.98% 23.55%, 38.91% 29.77%, 70.37% 85.29%, 148% 115%, 27% 115%, 1% 87%, 8% 82%, -24px 56%, 6px 0px)"
            //     : size === "small"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)";
  
            break;
          case "SIMPLE_HOOP":
            transform =
              size === "large"
                ? "translate3d(-20px, 6px, 0px)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "32px" : size === "small" ? "22px" : "28px";
            // polygone =
            //   size === "large"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : size === "small"
            //     ? "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)"
            //     : "polygon(54% 0%, 92% 0px, 78.29% 62.77%, 40% 127%, 20.47% 117.42%, 59% 33%, 29% 7%)";
  
            break;
  
          case "STUDSTAR":
            transform =
              size === "large"
                ? "translate3d(15px, 1px, 0px) rotate(-23deg)"
                : size === "small"
                ? "translate3d(15px, 1px, 0px) rotate(-23deg)"
                : "translate3d(15px, 1px, 0px) rotate(-23deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "27px";
            break;
          case "STUDMINI":
            transform =
              size === "large"
                ? "translate3d(-2px, 2px, 0px) rotate(45deg)"
                : size === "small"
                ? "translate3d(-2px, 2px, 0px) rotate(45deg)"
                : "translate3d(-2px, 2px, 0px) rotate(45deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "30px" : "30px";
            break;
          case "STUDLIGHTNING":
            transform =
              size === "large"
                ? "translate3d(13px, 2px, 0px) rotate(310deg)"
                : size === "small"
                ? "translate3d(13px, 2px, 0px) rotate(310deg)"
                : "translate3d(13px, 2px, 0px) rotate(310deg)";
            width =
              size === "large" ? "25px" : size === "small" ? "25px" : "25px";
            break;
          case "STUDMOON":
            transform =
              size === "large"
                ? "translate3d(4px, 23px, 0px) rotate(45deg)"
                : size === "small"
                ? "translate3d(13px, 9px, 0px) rotate(331deg)"
                : "translate3d(4px, 23px, 0px) rotate(45deg)";
            width =
              size === "large" ? "30px" : size === "small" ? "25px" : "27px";
            break;
          case "CLUSTER":
            transform =
              size === "large"
                ? "translate3d(14px, -1px, 0px) rotate(321deg)"
                : size === "small"
                ? "translate3d(8px, 4px, 0px) rotate(0deg)"
                : "translate3d(5px, 4px, 0px) rotate(214deg)";
            width =
              size === "large" ? "27px" : size === "small" ? "30px" : "28px";
            break;
  
          case "Constellation":
            transform =
              size === "large"
                ? "translate3d(15px, 0px, 0px) rotate(333deg)"
                : size === "small"
                ? "translate3d(15px, 0px, 0px) rotate(333deg)"
                : "translate3d(15px, 0px, 0px) rotate(333deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "21px" : "28px";
            break;
          case "Star_Chain":
            transform =
              size === "large"
                ? "translate3d(14px, 4px, 0px) rotate(333deg)"
                : size === "small"
                ? "translate3d(14px, 4px, 0px) rotate(333deg)"
                : "translate3d(14px, 4px, 0px) rotate(333deg)";
            width =
              size === "large" ? "29px" : size === "small" ? "21px" : "28px";
            break;
          case "TWISTED_GOLD":
            transform =
              size === "large"
                ? "translate3d(-4px, -12px, 0px) rotate(9deg)"
                : size === "small"
                ? "translate3d(-13px, 21px, 0px)"
                : "translate3d(-14px, 11px, 0px)";
  
            width =
              size === "large" ? "27px" : size === "small" ? "22px" : "28px";
            break;
          default:
            transform =
              size === "large"
                ? "translate(-4px, 7px)"
                : size === "small"
                ? "translate(-4px, 7px)"
                : "translate(-4px, 7px)";
  
            width =
              size === "large" ? "26px" : size === "small" ? "20px" : "23px";
            break;
        }
        break;
        case "F1":
          switch (earringType) {     
              case "TRIODIAMOND" :
                transform =
                size === "large"
                  ? "translate(11px, 7px) rotate(0deg)"
                  : size === "small"
                  ? "translate(10px, -5px) rotate(0deg)"
                  : "translate(11px, 7px) rotate(0deg)";
              width =
                size === "large" ? "24px" : size === "small" ? "16px" : "23px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(18% 1%, 33% 21%, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;    
              case "ENTRANCING" :
                transform =
                size === "large"
                  ? "translate(8px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(8px, -3px) rotate(0deg)"
                  : "translate(8px, -3px) rotate(0deg)";
              width =
                size === "large" ? "25px" : size === "small" ? "25px" : "25px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(18% 1%, 33% 21%, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;   
              case "CROSS" :
                transform =
                size === "large"
                  ? "translate(9px, -5px) rotate(0deg)"
                  : size === "small"
                  ? "translate(9px, -5px) rotate(0deg)"
                  : "translate(9px, -5px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "22px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(18% 1%, 33% 21%, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;    
              case "PEACE" :
                transform =
                size === "large"
                  ? "translate(12px,9px) rotate(0deg)"
                  : size === "small"
                  ? "translate(12px, 9px) rotate(0deg)"
                  : "translate(12px, 9px) rotate(0deg)";
              width =
                size === "large" ? "22px" : size === "small" ? "22px" : "22px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(18% 1%, 33% 21%, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;  
              case"SHOOTING" :
              transform =
              size === "large"
                ? "translate(12px, -4px) rotate(0deg)"
                : size === "small"
                ? "translate(12px, -4px) rotate(0deg)"
                : "translate(12px, -4px) rotate(0deg)";
            width =
              size === "large" ? "22px" : size === "small" ? "22px" : "22px";
              clipPath =
              size === "large" ?
               "" :  size === "small" ?  "polygon(0 0, 0 12%, 27% 18%, 46% 1%, 100% 0, 100% 25%, 100% 50%, 100% 59%, 100% 100%, 0 100%, 0 66%, 0 45%)" 
               :  ""
            break ;   
            case"PRECIOUS" :
            transform =
                size === "large"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : size === "small"
                  ? "translate(11px, -3px) rotate(0deg)"
                  : "translate(11px, -3px) rotate(0deg)";
              width =
                size === "large" ? "17px" : size === "small" ? "16px" : "17px";
                clipPath =
                size === "large" ?
                 "" :  size === "small" ?  "polygon(18% 1%, 33% 21%, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
                 :  ""
              break ;       
          case"DARLING" :
          transform =
          size === "large"
            ? "translate(12px, -2px) rotate(0deg)"
            : size === "small"
            ? "translate(12px, -2px) rotate(0deg)"
            : "translate(12px, -2px) rotate(0deg)";
        width =
          size === "large" ? "22px" : size === "small" ? "16px" : "22px";
          clipPath =
          size === "large" ?
           "" :  size === "small" ?  "polygon(18% 1%, 33% 21%, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
           :  ""
        break ;  
        case"MARVELOUS" :
        transform =
        size === "large"
          ? "translate(7px, -5px) rotate(0deg)"
          : size === "small"
          ? "translate(7px, -5px) rotate(0deg)"
          : "translate(7px, -5px) rotate(0deg)";
      width =
        size === "large" ? "22px" : size === "small" ? "22px" : "22px";
        clipPath =
        size === "large" ?
         "" :  size === "small" ?  "polygon(18% 1%, 33% 21%, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
         :  ""
      break ;   
      case"PLANET" :
      transform =
          size === "large"
            ? "translate(6px, -4.5px) rotate(0deg)"
            : size === "small"
            ? "translate(6px, -4.5px) rotate(0deg)"
            : "translate(6px, -4.5px) rotate(0deg)";
        width =
          size === "large" ? "22px" : size === "small" ? "24px" : "22px";
          clipPath =
          size === "large" ?
           "" :  size === "small" ?  "polygon(18% 1%, 33% 21%, 100% 0, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0 0)" 
           :  ""
        break ;       
    case"PEACESIGN" :
    transform =
    size === "large"
      ? "translate(8px, -2.5px) rotate(0deg)"
      : size === "small"
      ? "translate(8px, -2.5px) rotate(0deg)"
      : "translate(8px, -2.5px) rotate(0deg)";
  width =
    size === "large" ? "22px" : size === "small" ? "24px" : "22px";
    clipPath =
    size === "large" ?
     "" :  size === "small" ?  "polygon(0 23%, 0 0, 10% 10%, 45% 15%, 80% 0, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
     :  ""
  break ;  
  case"HAND" :
  transform =
  size === "large"
    ? "translate(9px, -2px) rotate(0deg)"
    : size === "small"
    ? "translate(9px, -2px) rotate(0deg)"
    : "translate(9px, -2px) rotate(0deg)";
  width =
  size === "large" ? "22px" : size === "small" ? "24px" : "22px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 10% 10%, 45% 15%, 80% 0, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ;
  case"CELESTIAL" :
  transform =
  size === "large"
    ? "translate(12px, 8px) rotate(0deg)"
    : size === "small"
    ? "translate(9px, -4px) rotate(0deg)"
    : "translate(9px, -4px) rotate(0deg)";
  width =
  size === "large" ? "22px" : size === "small" ? "22px" : "22px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 10% 10%, 45% 15%, 80% 0, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ; 
  case"SUMMER" :
  transform =
  size === "large"
    ? "translate(8px, -2px) rotate(0deg)"
    : size === "small"
    ? "translate(8px, -2px) rotate(0deg)"
    : "translate(8px, -2px) rotate(0deg)";
  width =
  size === "large" ? "22px" : size === "small" ? "22px" : "22px";
  clipPath =
  size === "large" ?
   "" :  size === "small" ?  "polygon(0 23%, 0 0, 10% 10%, 45% 15%, 80% 0, 100% 26%, 100% 50%, 100% 65%, 100% 100%, 0 99%, 0 57%, 0 41%)" 
   :  ""
  break ;  
          }
          break;
        default:
    }
    }
    return {
      transform,
      width,
      clipPath,
    };
  };

  const getStyle = (prod: any, pos: any) => {
    let style = {};
    const isCircle = prod.shape === "circle";

    const s = getEarringStyleByType(prod?.type, prod?.size, pos);
    if (sideIndex === "left") {
      switch (pos) {
        case "A":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "A1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "B":
          style = {
            width: s?.width,
            clipPath: s?.clipPath,
            transform: s?.transform,
          };
          break;
        case "B1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "DotB":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "C":
          style = {
            width: s?.width,
            clipPath: s?.clipPath,
            transform: s?.transform,
          };
          break;
        case "C1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "DotC":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "D":
          style = {
            width: s?.width,
            transform: s?.transform,
            clipPath: s?.clipPath,
          };
          break;
        case "D1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "DotD":
          style = {
            ...(isCircle && {
              clipPath:
                "polygon(57% 8%, 80% 12%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 3% 58%, 50% 67%)",
            }),
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "E":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "DotE":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "E1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "F":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "DotF":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "F1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
      }
    }

    if (sideIndex === "right") {
      switch (pos) {
        case "A":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "A1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };

          break;
        case "B":
          style = {
            width: s?.width,
            transform: s?.transform,
            clipPath: s?.clipPath,
          };
          break;
        case "B1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "DotB":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "C":
          style = {
            width: s?.width,
            transform: s?.transform,
            clipPath: s?.clipPath,
          };
          break;
        case "C1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "DotC":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "D":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "D1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "DotD":
          style = {
            ...(isCircle && {
              clipPath:
                "polygon(57% 8%, 80% 12%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 3% 58%, 50% 67%)",
            }),
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "E":
          style = {
            width: s?.width,
            transform: s?.transform,
            clipPath: s?.clipPath,
          };
          break;
        case "DotE":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "E1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "F":
          style = {
            width: s?.width,
            transform: s?.transform,
            clipPath: s?.clipPath,
          };
          break;
        case "DotF":
          style = {
            width: s?.width,
            transform: s?.transform,
          };
          break;
        case "F1":
          style = {
            clipPath: s?.clipPath,
            width: s?.width,
            transform: s?.transform,
          };
          break;
      }
    }

    return style;
  };

  return (
    <div className="main-content-area" ref={addProductIdRef}>

      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
        onDragMove={handleDragMove}
        collisionDetection={closestCenter}
      >
        {isLoading && (
          <div className="loader">
         <svg aria-hidden="true" className="inline w-10 h-10text-gray-200 animate-spin dark:text-gray-600 fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
          </div>
        )}

        <div
          className={`flex gap-4 flex-wrap m-0 show-product-area ${
            isLoading ? "bulred" : ""
          }`}
          id="lark-and-berry"
        >
          <div className="page-content-area">
            <div className="lark-bery-left-image-cover">
              <div className="flex justify-between p-2 bg-black-img">
                <h2 className="text-lg text-white font-semibold">
                  Lark & Berry
                </h2>
                <div className="cursor-pointer text-white">
                  <OptionsMenu
                    earRef={earRef}
                    setCurrentPoint={setCurrentPoint}
                  />
                </div>
              </div>
              <div
                ref={earRef}
                className="bg-gray-100 rounded-md shadow-lg flex justify-center items-center relative h-[400px] w-[375px] lark-berry-ears-image"
              >
                <div
                  className="flex gap-2 flex-col absolute top-0 left-0 z-10"
                  ref={droppableRef}
                >
                  <div className="h-full w-full">
                    {(side == "L" ? dropPointsLeft : dropPointsRight).map(
                      (p) => {
                        // const position = p.id;
                        // const imageIndex =
                        //   position.charCodeAt(0) - "A".charCodeAt(0);
                        // const imageUrl   = imageMappings[position];
                        return (
                          <div
                            className={`circle`}
                            key={`${p.id}${Math.random()
                              .toString(36)
                              .replace("0.", "circle" || "")}`}
                            style={{
                              position: "absolute",
                              top: `${p.y}px`,
                              left: `${p.x}px`,

                              border:
                               isDragging &&
                               ringType === "circle" 
                               ? "1px solid white"
                               : "",
                          
                          
                             borderRadius:
                              isDragging &&
                              ringType === "circle" 
                                ? "50%"
                                : "",

                             background:
                              isDragging &&
                              ringType === "circle" 
                                ? "rgba(255, 255, 255, 0.5)"
                                : "transparent",
                            }}
                          >
                            <DroppableComp
                              id={p.id}
                              key={p.id}
                              disabled={p.disabled}
                              ringType={ringType}
                            >
                              {annotations !== undefined &&
                                annotations[sideIndex] !== undefined &&
                                annotations[sideIndex][p.id] !== undefined && (
                                  <DraggbleComp id={p.id}>
                                    <div className="group relative h-full w-full">
                                      {
                                        annotations[sideIndex][p.id]?.shape ==
                                          "circle" && (
                                          <>
                                            <img
                                              className={"image" + p.id}
                                              src={
                                                annotations[sideIndex][p.id]
                                                  .images[p.id as Position]
                                              }
                                              // src={imageUrl}
                                              style={{
                                                ...getStyle(
                                                  annotations[sideIndex][p.id],
                                                  p.id
                                                ),
                                              }}
                                            />
                                            {/* {isDragging && (
                                            <div className="drag-message">
                                              {alert('alredy set ')}
                                            </div>
                                          )} */}
                                          </>
                                        )
                                      }
                                    </div>
                                  </DraggbleComp>
                                )}
                            </DroppableComp>
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div className="h-full w-full">
                    {(side == "L"
                      ? dropPointsForDotCrawleronLeft
                      : dropPointsForDotCrawleronRight
                    ).map((p) => {
                      return (
                        <div
                          className={`dot`}
                          key={p.id}
                          style={{
                            position: "absolute",
                            top: `${p.y}px`,
                            left: `${p.x}px`,
                              border:
                               isDragging &&
                               ringType === "dot" 
                               ? "1px solid white"
                               : "",
                          
                          
                             borderRadius:
                              isDragging &&
                              ringType === "dot" 
                                ? "50%"
                                : "",

                             background:
                              isDragging &&
                              ringType === "dot" 
                                ? "rgba(255, 255, 255, 0.5)"
                                : "transparent",
                          }}
                        >
                          <DroppableDotComp
                            id={p.id}
                            key={p.id}
                            disabled={p.disabled}
                            ringType={ringType}
                          >
                            {annotations !== undefined &&
                              annotations[sideIndex] !== undefined &&
                              annotations[sideIndex][p.id] !== undefined && (
                                <DraggableDotComp id={p.id}>
                                  <div className="group relative h-full w-full">
                                    {annotations[sideIndex][p.id]?.shape ==
                                      "dot" && (
                                      <>
                                        {/* <img
                                            className={"image" + p.id}
                                            src={
                                              annotations[sideIndex][p.id]
                                                .images[p.id as Position]
                                            }
                                            // src={imageUrl}
                                            style={{
                                              ...getStyle(
                                                annotations[sideIndex][p.id],
                                                p.id
                                              ),
                                            }}
                                          /> */}
                                        <img
                                          src={
                                            annotations[sideIndex][p.id]
                                              ?.images["dotsImage"]
                                          }
                                          className={`dot`}
                                          style={{
                                            height: "auto",
                                            objectFit: "contain",
                                            ...getStyle(
                                              annotations[sideIndex][p.id],
                                              p.id
                                            ),
                                          }}
                                        />
                                      </>
                                    )}
                                  </div>
                                </DraggableDotComp>
                              )}
                          </DroppableDotComp>
                        </div>
                      );
                    })}
                  </div>

                  <div className="h-full w-full">
                    {(side == "L"
                      ? dropPointsLeftAddOnLeft
                      : dropPointsRightAddOnRight
                    ).map((p) => {
                      return (
                        <div
                          className={`addon`}
                          key={p.id}
                          style={{
                            position: "absolute",
                            top: `${p.y}px`,
                            left: `${p.x}px`,
                            border:
                            isDragging &&
                            ringType === "addon" &&
                            activeAddonPoints.includes(p.id)
                              ? "1px solid white"
                              : "",
                          
                          
                            borderRadius:
                              isDragging &&
                              ringType === "addon" &&
                              activeAddonPoints.includes(p.id)
                                ? "50%"
                                : "",
                            background:
                              isDragging &&
                              ringType === "addon" &&
                              activeAddonPoints.includes(p.id)
                                ? "rgba(255, 255, 255, 0.5)"
                                : "transparent",
                          }}
                        >
                          <DroppableAddOnComp
                            id={p.id}
                            key={p.id}
                            disabled={p.disabled}
                            ringType={ringType}
                          >
                            {annotations !== undefined &&
                              annotations[sideIndex] !== undefined &&
                              annotations[sideIndex][p.id] !== undefined && (
                                <DraggbleAddOnComp id={p.id}>
                                  <div className="group relative h-full w-full">
                                    {annotations[sideIndex][p.id].shape ===
                                      "addon" && (
                                      <>
                                        <img
                                          className={"image" + p.id}
                                          src={
                                            annotations[sideIndex][p.id]?.images
                                              .dotsImage
                                          }
                                          alt="test"
                                          style={{
                                            height: "auto",
                                            ...getStyle(
                                              annotations[sideIndex][p.id],
                                              p.id
                                            ),
                                            // clipPath:
                                            // clipPathLookup[sideIndex][
                                            //   p.id as Position
                                            // ],
                                          }}
                                        />
                                      </>
                                    )}
                                  </div>
                                </DraggbleAddOnComp>
                              )}
                          </DroppableAddOnComp>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {errorMessagePoints ? (
                  <div
                    style={{
                      color: "#000",
                      background: "#fff",
                      width: "100%",
                      padding: "5px",
                      zIndex: "999",
                    }}
                  >
                    {errorMessagePoints}
                  </div>
                ) : (
                  ""
                )}

                <Ear />

                {/* Drop area ie: Ear */}
                {currentPoint ? (
                  <button
                    className="absolute bottom-2 right-6 hover:underline text-white  px-1 rounded-sm lark-berry-remove"
                    onClick={() => {
                      remove();
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div>{/* <HeaderContent/> */}</div>
              {/* Buy Button */}
              <div className="flex justify-center w-full  btn-prod-view">
                {isMobile ? null : (
                  <BuyButton addedProducts={addedProduts} earRef={earRef} />
                )}
              </div>
              {/* Buy Button */}
            </div>
          </div>

          {/* Tabs */}
          <Tabs dragDataX={dragDataX} updateDragDataX={setDragDataY} />
          {/* Tabs */}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeId && (
            <img
              src={
                products.find((p) => p.id.toString() == activeId)
                  ?.imageTransparent
              }
              // value={allImages}

              style={{
                width: "30px",
                height: "auto",
                objectFit: "contain",
                zIndex: 90000,
              }}
            />
          )}
        </DragOverlay>
        {/* <HeaderContent/> */}
      </DndContext>
    </div>
  );
};
export default View;
