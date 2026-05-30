/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { THelpCategory } from "@/plane-web/types/help-center";
import { CategoryCard } from "./category-card";

type Props = { categories: THelpCategory[]; onSelect: (categoryId: string) => void };

// Responsive "browse by function" grid of category cards.
export const CategoryGrid = ({ categories, onSelect }: Props) => {
  if (categories.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} onSelect={onSelect} />
      ))}
    </div>
  );
};
