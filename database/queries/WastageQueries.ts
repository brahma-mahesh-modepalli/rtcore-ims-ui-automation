export const WastageQueries = {
  getWasteReason: `
    SELECT reason_id, code, description
    FROM public.waste_reason
    WHERE description = $1 AND active = true
    LIMIT 1
  `,

  getFirstActiveWasteReason: `
    SELECT reason_id, code, description
    FROM public.waste_reason
    WHERE active = true
    ORDER BY reason_id
    LIMIT 1
  `,
};
