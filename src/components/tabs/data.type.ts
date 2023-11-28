export interface Response {
  circle: Addon;
  dot: Addon;
  addon: Addon;
}

export interface Addon {
  products: IProduct[];
}

export interface IProduct {
  
  
  variant_images: string;
  id: number;
  title: string;
  body_html: string;
  vendor: Vendor;
  product_type: ProductType;
  productShape:string;
  created_at: Date;
  handle: string;
  updated_at: Date;
  published_at: Date | null;
  template_suffix: null;
  status: Status;
  published_scope: PublishedScope;
  tags: string;
  admin_graphql_api_id: string;
  options: Option[];
  images: Image[];
  image: Image;
  shape: "circle" | "dot" | "addon" ;
  size:string;
  type : "crawler" | "Cluster" | "Constellation" | "Star Chain" ,
  imageTransparent: string;
  currency_code:string;
  price:string;
  variants: {
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string;
    position: number;
    inventory_policy: string;
    compare_at_price: string;
    fulfillment_service: string;
    inventory_management: string;
    option1: string;
    option2: null;
    option3: null;
    created_at: Date;
    updated_at: Date;
    taxable: boolean;
    barcode: string;
    grams: number;
    image_id: number;
    weight: number;
    weight_unit: string;
    inventory_item_id: number;
    inventory_quantity: number;
    old_inventory_quantity: number;
    requires_shipping: boolean;
    admin_graphql_api_id: string;
    mainImage: string;
    imagesAll: ImagesAll;
  }[];
}
export interface Image {
  // id: number;
  // product_id: number;
  // position: number;
  // created_at: Date;
  // updated_at: Date;
  // alt: null | string;
  // width: number;
  // height: number;
  src: string;
  // variant_ids: number[];
  // admin_graphql_api_id: string;
}
interface ImagesAll {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  F: string;
  Dp:string;
  dotsImage: string;
}

interface Option {
  id: number;
  product_id: number;
  name: Name;
  position: number;
}

export type Name =
  | "Size"
  | "Color"
  | "Gold Colour"
  | "Stone"
  | "Title"
  | "Side"
  | "Size of Hoop"
  | "Gold";

export type ProductType =
  | "Fine Piercings"
  | "Piercing Charm"
  | ""
  | "Rings"
  | "Necklaces"
  | "Earrings"
  | "Bracelets";

export type PublishedScope = "global" | "web";

export type Status = "active" | "draft";

export type Vendor = "Ear Envy" | "Lark & Berry";
