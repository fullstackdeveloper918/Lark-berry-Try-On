import { callApi } from "@/api/config";
import { useEar } from "@/store/earDetails";
import { useCallback, useEffect, useMemo, useState } from "react";
const Ear = () => {
  const [imageUrl, setImageUrl] = useState<string>();
  const { side, colorComplex } = useEar();
  const sideIndex = useMemo(() => (side === "R" ? 1 : 2), [side]);
  // const leftOrRight = useMemo(() => (side === "R" ? "right" : "left"), [side]);
  // const lookup = {
  //   left: {
  //     light: "ears/leftLight.png",
  //     medium: "ears/leftMedium.png",
  //     dark: "ears/leftDark.png",
  //     darkest: "ears/leftDarkest.png",
  //   },
  //   right: {
  //     light: "ears/rightLight.png",
  //     medium: "ears/rightMedium.png",
  //     dark: "ears/rightDark.png",
  //     darkest: "ears/rightDarkest.png",
  //   },
  // };

  const fetchImage = useCallback(
    async (colorComplex: string, sideIndex: number) => {
      const res = await callApi(`earimages/${colorComplex}/${sideIndex}`);
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data?.imageUrl);
      }
    },
    []
  );

  useEffect(() => {
    (async () => fetchImage(colorComplex, sideIndex))();
  }, [sideIndex, colorComplex, fetchImage]);
  
  return (
    <div>
      <img
        // #TODO : changes needed to make dynamic
        src={imageUrl}
        // src={lookup[leftOrRight][colorComplex]}
        className="absolute top-0 left-0 w-full h-full object-contain"
        // crossOrigin="anonymous"
      />

    </div>
  );
};

export default Ear;
