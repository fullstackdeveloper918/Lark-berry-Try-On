import { useDraggable } from "@dnd-kit/core";
import { PropsWithChildren } from "react";
// import Image from '../../assets/kOnzy.gif'

const DraggbleComp = ({ id, children }: { id: string } & PropsWithChildren) => {
  // const [isLoading , setIsLoading] = useState(true)
  const { attributes, transform, setNodeRef, listeners } = useDraggable({
    id: id.toString(),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <>
  
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
     style={style}
    >
        
       
      {children}
       </div>
        
        </>
     );
};

//..................Dot Draggable components.............\\


export const DraggableDotComp = ({ id, children }: { id: string } & PropsWithChildren) => {
  const { attributes, transform, setNodeRef, listeners } = useDraggable({
    id: id.toString(),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
    >
      {children}
    </div>
  );
};


export const DraggbleAddOnComp = ({ id, children }: { id: string } & PropsWithChildren) => {
  const { attributes, transform, setNodeRef, listeners } = useDraggable({
    id: id.toString(),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
    >
      {children}
    </div>
  );
};




export default DraggbleComp;
