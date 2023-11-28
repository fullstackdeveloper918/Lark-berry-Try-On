import { useProductstore } from "@/store/products";
import { useState, useEffect } from "react";
import DraggableNested from "../dnd/DraggableNested";
import ReactLoading from "react-loading";

const ExploreTab = ()=> {
  /*const [searchValue, setSearchValue] = useState<string>();*/
  const { products } = useProductstore();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (products.length < 1) {
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5000 milliseconds (5 seconds)

      return () => {
        // Clear the timeout if the component unmounts
        clearTimeout(loadingTimeout);
      };
    } else {
      setIsLoading(false);
    }
  }, [products]);
console.log(products,'prod')
  return (
    <>
      <div className="grid grid-cols-3 gap-4 produc-exp-ui tab-inner">
        {products.length < 1 ? (
          <p>No products found</p>
        ) : (
          products.map((product) => (
            <DraggableNested
              id={product?.id.toString()}
              data={product}
              key={product?.id}
              
            />
          ))
        )}
        {isLoading && (
          <ReactLoading
            type="balls"
            color="#000000"
            height={"20%"}
            width={"20%"}
          />
        )}
      </div>
    </>
  );
};
export default ExploreTab;
