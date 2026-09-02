import { Employee, IEmployee, IUser } from '../models/allModels';

/**
 * Robustly finds the Employee document corresponding to an authenticated User document.
 * Matches strictly by userId or exact user email address to prevent cross-account mismatches.
 */
export async function getEmployeeForAuthUser(user?: IUser | null): Promise<IEmployee | null> {
  if (!user) return null;

  // 1. Primary lookup: Match exact userId
  if (user._id) {
    const empByUserId = await Employee.findOne({ userId: user._id }).populate('department', 'name code description status');
    if (empByUserId) return empByUserId;
  }

  // 2. Secondary lookup: Match exact user email address
  if (user.email) {
    const empByEmail = await Employee.findOne({ email: user.email.toLowerCase() }).populate('department', 'name code description status');
    if (empByEmail) return empByEmail;
  }

  return null;
}
