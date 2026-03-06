export type Role = 'student' | 'teacher' | 'admin';

export const RoleStorage = {
  getRole(): Role {
    return (localStorage.getItem('user_role') as Role) || 'student';
  },
  setRole(role: Role) {
    localStorage.setItem('user_role', role);
  }
};
