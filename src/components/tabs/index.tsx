/* eslint-disable react-hooks/exhaustive-deps */
import { callApi } from "@/api/config";
import { cn } from "@/lib/utils";
import { useProductDetailsStore } from "@/store/productDetails";
import { useProductstore } from "@/store/products";
import { useEffect, useState, useRef, useMemo } from "react";
import ExploreTab from "./ExploreTab";
import MyLooksTab from "./MyLooksTab";
import MySelectionsTab from "./MySelections";
import ProductDetailsTab from "./ProductDetails";
import { useAnnotationsStore } from "../../store/annotations";
import { useEar } from "@/store/earDetails";
import InfiniteScroll from "react-infinite-scroll-component";
// import { useDisclosure } from '@mantine/hooks';
// import { Drawer, Button } from '@mantine/core';
// import HeaderContent from "../ui/HeaderContent";
// import Drawer from 'react-modern-drawer'
// import 'react-modern-drawer/dist/index.css'
// import { IProduct } from "./data.type";
// import SearchIcon from "../SearchIcon/SearchIcon";
// import XMark from "../SearchIcon/xMark";
// import UptoIcon from "../SearchIcon/UptoIcon";
import BuyButton from "../BuyButton";
import { useMediaQuery } from "react-responsive";

import Draggable, { DraggableEvent, DraggableData } from "react-draggable";
// import { Drawer } from "../dnd/Drawer";

const Tabs = ({
  dragDataX,
  updateDragDataX,
}: // activeId,
{
  dragDataX: number;
  updateDragDataX: (newDragDataX: number) => void;
}) => {
  const { showDetails } = useProductDetailsStore();
  const [addedProducts, setAddedProducts] = useState<
    { price: string; variantId: number; shape: string | undefined }[]
  >([]);
  const earRef = useRef(null);
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
  const droppableRef = useRef(null);
  const tabs = [
    "Explore",
    "Curated Looks",
    "My Selections",
    "My Looks",
    "detailed",
  ] as const;
  const [currentTab, setCurrentTab] =
    useState<(typeof tabs)[number]>("Explore");
  const setProducts = useProductstore((state) => state.setProducts);
  const currentProducts = useProductstore((state) => state.products);
  const annotations = useAnnotationsStore((state) => state.annotations);
  const [page, setPage] = useState(1);
  const [hideButton, setHideButton] = useState(false);
  const [dragDataY, setDragDataY] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  console.log(isCompleted,'curreent')


  const loadMore = () => {
    setTimeout(() => {
      setPage(page + 1);
      if (page >= 1) {
        setIsCompleted(true);
      } else {
        setIsCompleted(false);
      }
    }, 1500);
  };

  const side = useEar((state) => state.side);
  const sideIndex = useMemo(
    () => (side === "L" ? ("left" as const) : ("right" as const)),
    [side]
  );
  const [inputValue, setInputValue] = useState("");
  const handleKeyPress = (value: string) => {
    setInputValue(value);
    getProductsList(value);
  };

  const getEarringType = (title: string | string[]) => {
    if (title.includes("Drop Diamond Crawler")) {
      return "CRAWLER";
    } else if (title.includes("Cluster Stud")) {
      return "CLUSTER";
    } else if (title.includes("Mini Heart")) {
      return "STUDSTAR";
    } else if (title.includes("Mini Moon")) {
      return "STUDMOON";
    } else if (title.includes("Constellation")) {
      return "Constellation";
    } else if (title.includes("Star Chain")) {
      return "Star_Chain";
    } else if (title.includes("Knife Edged")) {
      return "KNIFE_EDGED";
    } else if (title.includes("Modernist Colourful")) {
      return "MODERN_COLOUR";
    } else if (title.includes("Brushed")) {
      return "BRUSHED";
    } else if (title.includes("Simple Hoop")) {
      return "SIMPLE_HOOP";
    } else if (title.includes("Twisted Gold")) {
      return "TWISTED_GOLD";
    }else if(title.includes("Stone Diamond Crawler")) {
      return 'DIAMOND_CRAWLER'
    }else if (title.includes("Mini Shooting")) {
      return 'STUDMINI'
    }else if (title.includes("Lightning Strike Diamond")) {
      return 'STUDLIGHTNING'
    }else if(title.includes("Shooting Star Diamond Crawler ")) {
      return 'DIAMONDCRAWLER'
    }else if(title.includes("Trio Diamond Charm")) {
      return 'TRIODIAMOND'
    }else if(title.includes("Entrancing Eye Diamond Charm")) {
      return 'ENTRANCING'
    }else if(title.includes("Cross Diamond Charm")) {
      return 'CROSS'
    }else if(title.includes("Peace Sign Diamond Charm")) {
      return 'PEACE'
    }else if(title.includes("Shooting Star Black Spinel Charm")) {
      return 'SHOOTING'
    }else if(title.includes("Darling Diamond Charm")) {
      return 'DARLING'
    }else if(title.includes("Precious Petal Diamond Charm")) {
      return 'PRECIOUS'
    }else if(title.includes("Marvelous Moon Diamond Charm")) {
      return 'MARVELOUS'
    }else if(title.includes("Planet Diamond Charm")) {
      return 'PLANET'
    }else if(title.includes("Peace Sign Black Spinel Charm")) {
      return 'PEACESIGN'
    }else if(title.includes("Hand of Fatima Diamond Charm")) {
      return 'HAND'
    }else if(title.includes("Celestial Diamond Charm")) {
      return 'CELESTIAL'
    }else if(title.includes("Summer Sun Diamond Charm")) {
      return 'SUMMER'
    }else if(title.includes("Shooting Star Diamond Charm")) {
      return 'SHOOTING'
    }else if(title.includes("Cross Black Spinel Charm")) {
      return 'CROSS'
    }
  };

  // console.log('currentProduct', currentProducts)
  // const parseProductData = (data) => {
  //   if (Object.entries(data.data).length > 0) {
  //     return Object.entries(data.data).map(([key, value]) => {
  //       return value.products.map((val) => ({
  //         ...val,
  //         shape: key,
  //         type: getEarringType(val.title)
  //       }));
  //     }).flat();
  //   }

  //   return  []
  // };

  const getProductsList = async (title_name: string) => {

    try {
      // Show loader
      /* setIsLoading(true); */
      setIsCompleted(false);
      setHideButton(false);
      const response = await callApi(
        `collectionnew?_limit=12&page=${page}&title=${title_name}`
        //  `Collectionnewtest?_limit=12&page=${page}&title=${title_name}&filter=dot`
      );

      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modifiedProductsArray: any[] = [];
      if (data.status !== 200) {
        setHideButton(true);
      } else {
        console.log(Object.entries(data.data), "Object.entries(data.data)");
        if (Object.entries(data.data).length > 0) {
          for (const [key, value] of Object.entries(data.data)) {
            if (
              typeof value === "object" &&
              value !== null &&
              "products" in value
            ) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const cur = (value.products as any[]).map((val) => ({
                ...val,
                shape: key,
                type: getEarringType(val.title),
              }));

              modifiedProductsArray.push(...cur);
              // Use the setProducts function from the store to update the state
            }
          }
          setProducts([...modifiedProductsArray]);
        } else {
          setIsCompleted(false);
          setHideButton(false);
        }
        if (page === 1) {
          // If it's the first page of results, replace the current products
          setProducts([...modifiedProductsArray]);
        } else {
          // If it's not the first page, append the new results to the existing products list
          setProducts([...currentProducts, ...modifiedProductsArray]);
        }
        if (title_name !== "") {
          setHideButton(true);
          setIsCompleted(false);
        }
        // If there are no more results, hide the "Load More" button
        if (modifiedProductsArray.length === 0) {
          setHideButton(true);
          setIsCompleted(false);
        } else {
          // If there are more results, increment the current page number
          page + 1;
        }
        setIsCompleted(false);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      // Hide loader, regardless of success or failure
      /* setIsLoading(false); */
    }
  };
  
  useEffect(() => {
    getProductsList(inputValue);
  }, [page]);

  useEffect(() => {
    if (annotations == undefined) return;
    const leftData = Object.values(annotations.left)?.map((an) => ({
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
  const lookup = {
    Explore: {
      component: <ExploreTab />,
    },
    "Curated Looks": {
      component: <div className="text-left  mt-2">Curated Looks</div>,
    },
    "My Selections": {
      component: <MySelectionsTab />,
    },
    "My Looks": {
      component: <MyLooksTab />,
    },

    detailed: {
      component: <ProductDetailsTab />,
    },
  };

  useEffect(() => {
    if (showDetails === true) {
      setCurrentTab("detailed");
      // Handle your custom logic here to prevent something based on the condition.
    } else {
      setCurrentTab("Explore");
      // Handle other logic when the condition is not met.
    }
    window.scrollTo(0, 0);
  }, [showDetails]);

  useEffect(() => {
    if (dragDataX) {
      getPosition();
      // Use the position object here as needed
      // console.log("posi" , position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragDataX]);

  
  const getPosition = () => {
    if (dragDataX === 1) {
      return { x: 0, y: 0 };
    } else {
      return { x: 0, y: Math.min(0, Math.max(-305, dragDataY)) };
    }
  };

  
  
  const handleDrag = (_e: DraggableEvent, ui: DraggableData) => {
    updateDragDataX(0);
    setDragDataY(ui.y);
  };

  // const handleSearchButton = () => {
  //   sethideserach(true);
  // };
 



  return (
    <div className="right-prodview w-full">
      <InfiniteScroll
        dataLength={currentProducts.length}
        next={loadMore}
        hasMore={!hideButton}
        loader={
           <p className="text-2xl	"> Loading...</p>
        }
        style={{
          overflow : "none"
        }}
      >
        {isMobile ? (
          <div className="mobile-products-content draggable-button">
            <div className="stretchable" ref={droppableRef}>
              <Draggable
                axis="y"
                handle=".draggable-button"
                onDrag={handleDrag}
                position={getPosition()}
                bounds={{ top: -305, bottom: 0 }}
              >
            
                <div className="stretchabe">
        
                  <button
                    className="scroll-btn bg-gray-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full draggable-button z-50 mb-5"
                    style={{}}
                  >
                    ____
                  </button>
              
                  <div className="lark-berry-right-details">
                    <div className="product_options">
                      <ul className="flex gap-2 mb-4 tabsui flex-wrap ">
                        {tabs
                          .filter((el) => el !== "detailed")
                          .map((tab) => (
                            <li
                              key={tab}
                              onClick={() => {
                                setCurrentTab(tab);
                              }}
                              className={cn(
                                "text-base md:text-2xl font-semibold cursor-pointer ",
                                {
                                  "active-tab": currentTab === tab,
                                }
                              )}
                            >
                              {tab}
                            </li>
                          ))}
                      </ul>
                      {currentTab === "Explore" ? (
                        <div className="search-icon-Inner ">
                          {/* <SearchIcon /> */}
                          <form className="flex items-center justify-start my-4 Searchbar-tab">
                            <div className="search-field flex">
                              <div className="search-field-input">
                                <input
                                  type="search"
                                  className="px-4 py-2 rounded-md bg-white text-black"
                                  placeholder="Search"
                                  onChange={(e) =>
                                    handleKeyPress(e?.target?.value)
                                  }
                                />

                              </div>
                              {/* <button
              className="mx-1 border border-slate-500 px-4 py-2 rounded-md"
              type="button"
            >
              Search
            </button> */}
                            </div>
                          </form>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>

                    {lookup[currentTab].component}
                    {/* <div className="grid-grid my-5">
                    {currentTab !== "Explore" ? null : isCompleted ? (
                      // If hideButton is false or currentTab is not "Explore" and isCompleted is true
                      <button
                        type="button"
                        className={
                          hideButton
                            ? "hidden"
                            : "button button--outlined js-btn-load-more disabled"
                        }
                      >
                        Loading...
                      </button>
                     
                  
                    ) : (
                      // Otherwise, render this button
                      <button
                        onClick={loadMore}
                        type="button"
                        className={
                          hideButton
                            ? "hidden "
                            : "button button--outlined js-btn-load-more "
                        }
                      >
                        LOAD MORE
                      </button>
                    )}
                    {null}
                  </div> */}
                  </div>
                </div>
              </Draggable>
             
            </div>
           
          </div>
        ) : (
          <div className="lark-berry-right-details">
            <div className="product_options">
              <ul className="flex gap-2 mb-4 tabsui flex-wrap ">
                {tabs
                  .filter((el) => el !== "detailed")
                  .map((tab) => (
                    <li
                      key={tab}
                      onClick={() => {
                        setCurrentTab(tab);
                      }}
                      className={cn(
                        "text-base md:text-2xl font-semibold cursor-pointer ",
                        {
                          "active-tab": currentTab === tab,
                        }
                      )}
                    >
                      {tab}
                    </li>
                  ))}
              </ul>
              {currentTab === "Explore" ? (
                <div className="search-icon-Inner ">
                  <form className="flex items-center justify-start my-4 Searchbar-tab">
                    <div className="search-field flex">
                      <div className="search-field-input">
                        <input
                          type="search"
                          className="px-4 py-2 rounded-md bg-white text-black"
                          placeholder="Search"
                          onChange={(e) => handleKeyPress(e?.target?.value)}
                        />
                      </div>
                      {/* <button
              className="mx-1 border border-slate-500 px-4 py-2 rounded-md"
              type="button"
            >
              Search
            </button> */}
                    </div>
                  </form>
                </div>
              ) : (
                ""
              )}
            </div>
            {lookup[currentTab].component}
            {/* <div className={"grid-grid my-5 load-more-cover"}>
            {currentTab !== "Explore" ? null : isCompleted ? (
              // If hideButton is false or currentTab is not "Explore" and isCompleted is true
              <button
                type="button"
                className={
                  hideButton
                    ? "hidden"
                    : "button button--outlined js-btn-load-more load-more-button disabled"
                }
              >
                Loading...
              </button>
            ) : (
              // Otherwise, render this button
              <button
                onClick={loadMore}
                type="button"
                className={
                  hideButton
                    ? "hidden "
                    : "button button--outlined load-more-button js-btn-load-more "
                }
              >
                LOAD MORE
              </button>
            )}
            {null}
          </div> */}
          </div>
        )}
        {isMobile && (
          <div className="tos-buy-btn-mobile lark-berry-button-cover">
            <BuyButton addedProducts={addedProducts} earRef={earRef} />
          </div>
        )}
      </InfiniteScroll>
    </div>
  );
};

export default Tabs;
