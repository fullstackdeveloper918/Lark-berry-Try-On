import { useDroppable } from "@dnd-kit/core";
interface DroppableProps {
  children: React.ReactNode;
  disabled: boolean;
  id: string;
  ringType: string;
}

const DroppableComp = ({ id, ringType,children }: DroppableProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,     
  });
 
  return (
    <div
      className="droppable-area dot-area"
      style={{
        border: "1px solid gray",
        height: "50px",
        width: "50px",
        position: "relative",
        // border: '1px solid ',
        borderColor: isOver && ringType === "circle" ? "#rgba(255, 255, 255, 0.5)" : "transparent",
        borderRadius : isOver && ringType === "circle" ? "50%" : ""
        // borderColor: "#4c9ffe",
      }}
      ref={setNodeRef}
    >
      <div style={{ height: "100%", width: "100%" }}>{children}</div>
    </div>
  );
};

export const DroppableDotComp = ({ id,  ringType,children}: DroppableProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  if(isOver){
    console.log("OVER")
  }

  return (
    <div
      style={{
        border: "1px solid black",
        height: "50px",
        width: "50px",
        position: "relative",
        borderColor: isOver && ringType === "dot" ? "rgba(255, 255, 255, 0.5)": "transparent",
        borderRadius : isOver && ringType === "dot" ? "50%" : ""
        //  borderColor: "#4c9ffe",
           
      }}
      ref={setNodeRef}
    >
      <div style={{ height: "100%", width: "100%" }}>{children}</div>
    </div>
  );
};

export const DroppableAddOnComp = ({ id,ringType, children }: DroppableProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  if(isOver){
    console.log("OVER")
  }

  return (
    <div
      style={{
        // border: "1px solid ",
        height: "45px",
        width: "45px",
        position: "relative",
        borderColor: isOver && ringType === "addon" ? "rgba(255, 255, 255, 0.5)": "transparent",
        // borderColor: "#4c9ffe",
         borderRadius : isOver && ringType === "addon" ? "50%" : ""

      }}
      ref={setNodeRef}
    >
      <div style={{ height: "100%", width: "100%" }}>{children}</div>
    </div>
  );
};

export default DroppableComp;
