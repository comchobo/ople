import { connection } from "next/server";
import ProductIntro from "../components/product-intro/product-intro";

export default async function Home() {
  await connection();
  return <ProductIntro />;
}
