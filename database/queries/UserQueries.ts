export const UserQueries = {
  getUserByRole: `
    SELECT employee_id, store_id, first_name, last_name, role, active, email
    FROM employee
    WHERE role = $1 AND active = true
    LIMIT 1
  `,
};
