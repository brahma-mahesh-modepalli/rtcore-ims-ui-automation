export const UomQueries = {
  getUomByAbbreviation: `
    SELECT uom_id, name, abbreviation
    FROM public.uom
    WHERE abbreviation = $1
    LIMIT 1
  `,
};
