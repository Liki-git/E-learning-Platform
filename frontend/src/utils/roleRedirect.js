export const getRoleHome = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "instructor") return "/instructor/dashboard";
  return "/student/dashboard";
};
