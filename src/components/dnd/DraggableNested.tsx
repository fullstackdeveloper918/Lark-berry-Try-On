import { useDraggable } from "@dnd-kit/core";
// import { CSS } from "@dnd-kit/utilities";
import { IProduct } from "../tabs/data.type";

const DraggableNested = ({
  id,
  data,
  // isDragging,
}: {
  id: string;
  data: IProduct;
  // isDragging: string;
}) => {
  
  // const [setId, setSetId] = useState([id]);
  const { attributes, setNodeRef, listeners } = useDraggable({
    id: id.toString(),
  });
  console.log(data?.imageTransparent,"image")

 

  return (
    <div className="cursor-pointer product-list mb-5">
      <div className="p-2 bg-gray-100  view-product flex justify-center items-center">
        {/* {setId.map((id) => ( */}
        <div
          key={id}
          ref={setNodeRef}
          draggable="false"
          style={{
            // transform: CSS.Translate.toString(transform),
            touchAction: "none",
          }}
          {...attributes}
          {...listeners}
        >
          {/* {isDragging === id ? 
          <p style={{ background: 'white' }}>{`${data?.shape ==="circle" ? `Drag over Highlighted blue areas`: ''}
                ${data?.shape ==="dot" ? `Drag over Highlighted Yellow areas`: ''}
                ${data?.shape ==="addon" ? `Drag over Highlighted Green areas`: ''}
             ` }
             </p> : null} */}
          <img
            className={
              "w-full h-20 object-contain" 
              // (transform ? " custom-ring-image" : "")
            }
            src={data?.imageTransparent}
          />
        </div>
        {/* ))} */}
      </div>
      <div className="text-left">
        <p className="text-sm truncate lark-berry-vendor ">{data?.vendor}</p>
        <p className="text-sm truncate lark-berry-title focus-inset">
          {data?.title}
        </p>
        <p className="text-sm truncate lark-berry-price">
          {data?.currency_code} {data?.price}
        </p>
      </div>
    </div>
  );
};
export default DraggableNested;
