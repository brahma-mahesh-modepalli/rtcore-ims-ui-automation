export const RecipeQueries = {
  getActiveRecipe: `
    SELECT r.recipe_id, r.name, r.yield_uom_id, u.abbreviation AS uom
    FROM public.recipe r
    LEFT JOIN public.uom u ON u.uom_id = r.yield_uom_id
    WHERE r.name IS NOT NULL
      AND (r.effective_from IS NULL OR r.effective_from <= CURRENT_DATE)
      AND (r.effective_to IS NULL OR r.effective_to >= CURRENT_DATE)
    ORDER BY r.recipe_id
    LIMIT 1
  `,
};
