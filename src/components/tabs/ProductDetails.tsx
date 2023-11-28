import { callApi } from "@/api/config";
import { useAnnotationsStore } from "@/store/annotations";
import { useEar } from "@/store/earDetails";
import { useProductDetailsStore } from "@/store/productDetails";
import { Carousel } from "flowbite-react";
// import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
// import Loader from 'react-loader-spinner'
import { ChevronLeftCircle, ChevronRightCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IProduct } from "./data.type";

const ProductDetailsTab = () => {
  const product = useProductDetailsStore((state) => state.product);
  const { annotations, setAnnotations } = useAnnotationsStore();
  const [productDetails, setProductDetails] = useState<IProduct>();
  // const [isLoading , setIsLoading] = useState(false)
  const side = useEar((state) => state.side);
  const setShowDetails = useProductDetailsStore(
    (state) => state.setShowDetails
  );
  const sideIndex = useMemo(
    () => (side === "L" ? ("left" as const) : ("right" as const)),
    [side]
  );
  const [isLoader, setIsLoader] = useState(false);
  // useEffect(() => {
  //   if (product?.id === undefined) return;
  //   (async () => {
  //     const response = await callApi("singleproducts/" + product?.id);
  //     if (response.ok) {
  //       const singleProduct: { data: IProduct[] } = await response.json();
  //       // console.log("Product", singleProduct.data[0]);
  //       setProductDetails(singleProduct.data[0]);
  //     }
  //   })();
  //   // return () => {
  //   //   setShowDetails(true);
  //   // };
  // }, [product]);
  useEffect(() => {
    if (product?.id === undefined) return;
    let isMounted = true;
    (async () => {
      const response = await callApi("singleproducts/" + product.id);
      if (response.ok) {
        const singleProduct: { data: IProduct[] } = await response.json();
        if (isMounted) {
          setProductDetails(singleProduct.data[0]);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [product]);

  console.log("productDetailsproductDetails", productDetails);

  const changeVariantColor = async (idx: number) => {
    if (product?.position) {
      const images =
        annotations[sideIndex][product.position].options[idx].imagesAll;
      setAnnotations({
        ...annotations,
        [sideIndex]: {
          ...annotations[sideIndex],
          [product.position]: {
            ...annotations[sideIndex][product.position],
            images,
          },
        },
      });
    }
  };

      setTimeout(()=>{
        setIsLoader(false)
      },500)
  

  return (
    <div className="prod-detail-grid">
      <div>
        <div className="goback">
          {/* <button
            onClick={() => {
              setShowDetails(false);
            }}
          >
            <Undo2 className="icon-back" /> Go Back
          </button> */}
          <div
            className="w-7 "
            onClick={() => {
              setShowDetails(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="2em"
              viewBox="0 0 384 512"
              className="w-15 cursor-pointer"
            >
              <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col gap-2 justify-start items-start">
          <h2 className="text-2xl leading-6 font-semibold">
            {productDetails?.title}
          </h2>
          <p className="capitalize leading-8 text-base d-none">
            FINE PIERCINGS
          </p>
        </div>
        <div className="price-val">
          <p className="text-lg mt-2">
            {productDetails?.currency_code} {productDetails?.variants[0]?.price}{" "}
            <span className="tax-val">(Tax included)</span>
          </p>
        </div>
        <div className="flex flex-row-reverse items-start w-full galley-prod-detail">
          <div className="img-slider">
            <Carousel
              leftControl={<ChevronLeftCircle />}
              rightControl={<ChevronRightCircle />}
            >
              {productDetails?.images.map((image) => (
                <img
                  key={image?.src}
                  src={image?.src}
                  // className="absolute block max-w-full h-auto -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                  alt=""
                />
              ))}
            </Carousel>
          </div>
          <div className="w-full flex flex-col items-start">
            {productDetails?.variants &&
              productDetails?.variants.length > 1 && (
                <>
                  <h3 className="text-2xl font-semibold mb-4 variant-tt">
                    Select Variant
                  </h3>
                  <div
                    className="flex md:gap-4 gap-0 flex-wrap w-full thumb-prod"
                    key={product?.id}
                  >
                    {productDetails?.variants.map((variant, idx) => (
                      <div
                        key={idx}
                        className="cursor-pointer thumb-prod-item"
                        onClick={() => changeVariantColor(idx)}
                      >
                        {productDetails.productShape === "addon" ||
                        productDetails.productShape === "dot" ? (
                          <div className="prod-thumb-img options-area">
                            <img
                              src={variant.imagesAll.dotsImage}
                              alt=""
                              className="h-24 w-full object-cover border rounded-md"
                            />
                          </div>
                        ) : (
                          <div className="prod-thumb-img">
                            <img
                              src={variant.imagesAll["Dp"]}
                              alt=""
                              className="h-20 w-full object-cover rounded-md"
                            />
                          </div>
                        )}
                        <span className="text-sm">{variant?.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            {isLoader ? (
              <button
                type="submit"
                name="add"
                className="button product-selector__submit no-js-hidden button--filled button--uppercase btn-addcart btn btn--primary btn--outline"
                data-add-to-cart=""
              >
                <svg
                  aria-hidden="true"
                  className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                name="add"
                className="button product-selector__submit no-js-hidden button--filled button--uppercase btn-addcart btn btn--primary btn--outline"
                data-add-to-cart=""
                onClick={() => {
                  setIsLoader(true);
                  // setIsLoading(true)
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  add_to_single_product(productDetails?.variants[0]?.id);
                }}
              >
                Add to cart
              </button>
            )}
          </div>
        </div>

        <div className="text-left desc-data-bottom">
          <h3
            className="text-
        xl"
          >
            Description
          </h3>
          <p
            className="text-left"
            dangerouslySetInnerHTML={{
              __html: productDetails?.body_html ?? "",
            }}
          ></p>
        </div>
      </div>
    </div>
  );
};
export default ProductDetailsTab;
