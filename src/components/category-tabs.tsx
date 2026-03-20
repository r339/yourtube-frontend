import React, { useState } from "react";
import { Button } from "./ui/button";

const categories = [
  "All", "Music", "Gaming", "News", "Live", "Coding",
  "Sports", "Cooking", "Education", "Travel", "Technology",
];

const CategoryTabs = () => {
  const [active, setActive] = useState("All");

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <Button
          key={cat}
          variant={active === cat ? "default" : "secondary"}
          size="sm"
          className="flex-shrink-0 rounded-full"
          onClick={() => setActive(cat)}
        >
          {cat}
        </Button>
      ))}
    </div>
  );
};

export default CategoryTabs;
