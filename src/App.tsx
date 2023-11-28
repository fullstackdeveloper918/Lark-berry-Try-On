import { Toaster } from "react-hot-toast";
import "./App.css";
import View from "./components/View";
import React from "react";

function App() {
  // const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  // useEffect(() => {
  //   if (isMobile) {
  //     document.body.style.overflowY = "hidden";
  //   } else {
  //     document.body.style.overflowY = "auto"; // Reset the overflow if not mobile
  //   }

  //   return () => {
  //     document.body.style.overflowY = "auto"; // Make sure to reset the overflow when the component unmounts
  //   };
  // }, [isMobile]);

  return (
    <React.StrictMode>
      <View />
      <Toaster />
    </React.StrictMode>
  );
}

export default App;

