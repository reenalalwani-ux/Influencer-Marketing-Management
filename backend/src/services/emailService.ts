export const sendOTPEmail = async (toEmail: string, otpCode: string, userName: string = 'Team Member'): Promise<boolean> => {
  console.log(`[Direct Auth System] OTP Code generated for ${toEmail}: ${otpCode}`);
  return true;
};
