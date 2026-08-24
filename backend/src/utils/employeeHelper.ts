import { Employee, IEmployee, IUser } from '../models/allModels';

/**
 * Robustly finds the Employee document corresponding to an authenticated User document.
 * Searches by userId, employeeId, email (case-insensitive), or name.
 */
export async function getEmployeeForAuthUser(user?: IUser | null): Promise<IEmployee | null> {
  if (!user) return null;

  const queryConditions: any[] = [];
  if (user._id) queryConditions.push({ userId: user._id });
  if (user.employeeId) queryConditions.push({ employeeId: user.employeeId });
  if (user.email) queryConditions.push({ email: user.email.toLowerCase() });
  if (user.name) queryConditions.push({ name: user.name });

  if (queryConditions.length === 0) return null;

  return await Employee.findOne({ $or: queryConditions });
}
