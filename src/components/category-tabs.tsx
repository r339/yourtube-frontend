import React, { useState } from "react";

const categories = [
  "All", "Music", "Gaming", "News", "Live",
  "Coding", "Sports", "Cooking", "Education", "Travel", "Technology",
];

const CategoryTabs = () => {
  const [active, setActive] = useState("All");

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      {categories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              background: isActive ? "var(--chip-active-bg)" : "var(--chip-bg)",
              color: isActive ? "var(--chip-active-text)" : "hsl(var(--foreground))",
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
