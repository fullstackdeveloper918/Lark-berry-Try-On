import { callApi } from "@/api/config";
import { useAnnotationsStore } from "@/store/annotations";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useEar } from "@/store/earDetails";

const MyLooksTab = () => {
  const [myLooks, setMyLooks] = useState<
    {
      mylook_data: string;
      customer_id: number;
      mylook_image: string;
    }[]
  >([]);
  const { setAnnotations } = useAnnotationsStore();
  const { setColorComplex } = useEar();
  const customer_id = document.querySelector(
    "#customer_id"
  ) as HTMLInputElement;
  // const customer_id = {
  //   value: "7113628778769",
  // };
  useEffect(() => {
    if (!customer_id?.value) return;
    (async () => {
      const response = await callApi(`mylooks/${customer_id?.value}`);
      if (response.ok) {
        const looks = await response.json();
        setMyLooks(looks?.data);
      }
    })();
  }, [customer_id?.value]);

  const displayLook = (idx: number) => {
    
    const details = JSON.parse(myLooks[idx]?.mylook_data);
    setAnnotations(details.annotations);
    setColorComplex(details.colorComplex);
  };

  if (!customer_id?.value) {
    return (
      <div className="flex flex-col items-start tab-inner">
        <div>Oops, you are not logged In.</div>
        <Button className="mt-4 login-btn"
          onClick={() => {
            window.location.href =
            "/account/?from=custom-look";
          }}
        >
          Login
        </Button>
      </div>
    );
  }

  if (myLooks.length == 0)
    return (
      <h2>
        No looks found for this user. <br />
        Try saving some fresh looks.
      </h2>
    );
  return (
    <div className="flex flex-wrap gap-4">
      {myLooks.map((look, idx) => (
        <div
          className="w-52 h-52 border shadow-md cursor-pointer"
          onClick={() => displayLook(idx)}
          key={idx}
        >
          <img src={look?.mylook_image} alt="" className="h-full w-full " />
        </div>
      ))}
    </div>
  );
};

export default MyLooksTab;
