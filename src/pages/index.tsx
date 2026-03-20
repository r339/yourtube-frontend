import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";

export default function Home() {
  return (
    <div className="p-4">
      <CategoryTabs />
      <Videogrid />
    </div>
  );
}
