import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { MoreVertical } from "lucide-react";
import { callApi } from "@/api/config";
import { useProductDetailsStore } from "@/store/productDetails";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportAsImage } from "@/lib/exportAsImage";
import { cn } from "@/lib/utils";
import { wait } from "@/lib/wait";
import { useAnnotationsStore } from "@/store/annotations";
import { useEar } from "@/store/earDetails";
import { Loader2 } from "lucide-react";
import { RefObject, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertMessage } from "./AlertMessage";

export function OptionsMenu({ earRef,setCurrentPoint }: { earRef: RefObject<HTMLDivElement>, setCurrentPoint: (newCurrentPoint: string) => void  }) {
  const [showBothEars, setShowBothEars] = useState<boolean>(false);
  const [bothEarsImages, setBothEarsImages] = useState<{
    leftImage: string | undefined;
    rigthImage: string | undefined;
  }>();
  const [IsLogInError, setIsLogInError] = useState<boolean>(false);
  const { annotations, setAnnotations } = useAnnotationsStore();
  const { side, setSide, colorComplex, setColorComplex } = useEar();
  const sideIndex = useMemo(
    () => (side === "L" ? ("left" as const) : ("right" as const)),
    [side]
  );
  const setShowDetails = useProductDetailsStore(
    (state) => state.setShowDetails
  );
  const saveLook = async () => {
    const input = document.querySelector("#customer_id") as HTMLInputElement;
    if (input?.value) {
      const base64Image = await exportAsImage(earRef.current!);
      const formData = new FormData();
      formData.append("customer_id", input.value);
      formData.append("mylook_image", base64Image!);
      formData.append("mylook_data", JSON.stringify(annotations));
      const response = await callApi(`mylooks/${input.value}`, {
        // const response = await callApi(`mylooks/${7113628778769}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.status === 201) {
        toast.success("look saved successfully.", {
          position: "top-right",
        });
      } else {
        let errorMsg = "";
        Object.values(data.message).forEach((msg) => {
          errorMsg += msg + "\n";
        });
        toast.error(errorMsg, {
          position: "top-right",
        });
      }
    } else {
      toast.error("you need to login first", {
        position: "top-right",
      });
      setIsLogInError(true);
    }
  };
  const showBothEarsImages = async () => {
    setShowBothEars(true);
    const prev = side;
    setSide("R");
    await wait();
    const RightEarImage = await exportAsImage(earRef.current!);
    await wait();
    setSide("L");
    await wait();
    const LeftEarImage = await exportAsImage(earRef.current!);
    setBothEarsImages({
      leftImage: LeftEarImage,
      rigthImage: RightEarImage,
    });
    setSide(prev);
  };
  return (
    <>
      <AlertMessage
        open={IsLogInError}
        title="Can not save look"
        description="you need to login first to save a look"
        action={
          <>
            <button
              onClick={() => {
                window.location.href = "/account?from=custom-look";
              }}
            >
              Login
            </button>
          </>
        }
        onCancel={() => {
          setIsLogInError(false);
        }}
      />
      <AlertMessage
        open={showBothEars}
        title=""
        full={true}
        description={
          <>
            <div className="flex gap-2 justify-around flex-wrap w-full h-full">
              <div className="w-2/5">
                <p className="text-lg">Left Ear</p>
                {bothEarsImages?.leftImage !== undefined ? (
                  <img
                    className="h-full w-full object-cover"
                    src={bothEarsImages?.leftImage}
                    alt=""
                  />
                ) : (
                  <Loader2 size={30} className="animate-spin" />
                )}
              </div>
              <div className="w-2/5">
                <p className="text-lg">Right Ear</p>
                {bothEarsImages?.leftImage !== undefined ? (
                  <img
                    className="h-full w-full object-cover"
                    src={bothEarsImages?.rigthImage}
                    alt=""
                  />
                ) : (
                  <Loader2 size={30} className="animate-spin" />
                )}
              </div>
            </div>
          </>
        }
        onCancel={() => {
          setShowBothEars(false);
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>
            <MoreVertical />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 myOptionMenu" align="end">
          <DropdownMenuLabel>Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <h3 className="px-2 py-2">Color Complex</h3>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    setColorComplex("light");
                  }}
                  className={cn("cursor-pointer hover:bg-slate-100", {
                    "bg-slate-200": colorComplex === "light",
                  })}
                >
                  <h3 className="p-2">light</h3>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setColorComplex("medium");
                  }}
                  className={cn("cursor-pointer hover:bg-slate-100", {
                    "bg-slate-200": colorComplex === "medium",
                  })}
                >
                  <h3 className="p-2">Medium</h3>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setColorComplex("dark");
                  }}
                  className={cn("cursor-pointer hover:bg-slate-100", {
                    "bg-slate-200": colorComplex === "dark",
                  })}
                >
                  <h3 className="p-2">Dark</h3>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setColorComplex("darkest");
                  }}
                  className={cn("cursor-pointer hover:bg-slate-100", {
                    "bg-slate-200": colorComplex === "darkest",
                  })}
                >
                  <h3 className="p-2">Darkest</h3>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-slate-100"
            onClick={async () => {
              const image = await exportAsImage(earRef.current!);
              const link = document.createElement("a");
              link.href = image ?? "";
              link.download = "image.png";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <h3 className="px-4 py-2">Download</h3>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-slate-100"
            onClick={() => {
              setSide(side == "L" ? "R" : "L");
            }}
          >
            <h3 className="px-4 py-2">
              Show {side === "R" ? "Left" : "Right"} Ear
            </h3>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-slate-100"
            onClick={() => {
              showBothEarsImages();
            }}
          >
            <h3 className="px-4 py-2">Show Both Ears</h3>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-slate-100"
            onClick={() => {
              
              setShowDetails(false);
              setAnnotations({
                ...annotations,
                [sideIndex]: {},
              });
              setCurrentPoint("");
              // Add a toast message
              toast.error("Items has been removed.", {
                position: "top-right",
              });
            }}
          >
            <h3 className="px-4 py-2">Clear</h3>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-slate-100"
            onClick={async () => {
              saveLook();
            }}
          >
            <h3 className="px-4 py-2">Save</h3>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              window.location.href = window.location.host + "/pages/contact";
            }}
            className="cursor-pointer hover:bg-slate-100"
          >
            <h3 className="px-4 py-2">help</h3>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
export default OptionsMenu;
