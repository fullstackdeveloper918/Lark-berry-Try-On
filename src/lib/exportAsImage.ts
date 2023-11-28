import domtoimage from "dom-to-image";

export const exportAsImage = async (element: HTMLElement) => {
  let image;
  try {
    const dataUrl = await domtoimage.toPng(element);
    image = dataUrl;
  } catch (err) {
    console.error("oops, something went wrong!", err);
  }
  return image;
};
