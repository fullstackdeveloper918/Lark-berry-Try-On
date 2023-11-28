import { useState } from "react";

export default function HeaderContent() {
  const [showCheckBox, setShowCheckBox] = useState(true);
//   const [isChecked, setIsChecked] = useState(false);

  const ViewCheckBox = () => {
    setShowCheckBox(true);
  };

  const HideContent = () => {
    setShowCheckBox(false);
  };

//   const handleCheckboxChange = (event ) => {
//     const newCheckedValue = event.target.checked;
//     setIsChecked(newCheckedValue);

//     if (newCheckedValue) {
//         console.log('Checkbox is checked');
        
//         fetch("your-api-endpoint", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
         
//         })
//   }
// }
  return (
    <>
      <div>
        {showCheckBox ? (
          <>
            <div className="main-find-area">
              <button className="hide-button mb-3 "  onClick={HideContent}>
                Hide Content
              </button>
            
              <div className="border border-bottom mb-5"></div>
              <div className="main-checkbox-area">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    // onChange={handleCheckboxChange}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="flexCheckDefault"
                  >
                    Circle
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    // onChange={handleCheckboxChange}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="flexCheckChecked"
                  >
                    Dot
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    // onChange={handleCheckboxChange}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="flexCheckChecked"
                  >
                    Addon
                  </label>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
          <div className="show-checkbox-button">
            <button onClick={ViewCheckBox}>show content!</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
