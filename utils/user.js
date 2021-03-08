import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashPassword = async (password) => {
  if (password.length < 8) {
    throw new Error("Password must be 8 characters or longer.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return hashedPassword;
};

export const generateAuthToken = (userdDetails) =>
  jwt.sign(userdDetails, process.env.JWT_SECRET, {
    expiresIn: "7 days",
  });

export const getUserId = ({ request }, requireAuth = true) => {
  const authorization = request.headers.authorization;

  if (authorization) {
    const token = authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded.id;
  }

  if (requireAuth) {
    throw new Error("Authentication Required");
  }

  return null;
};
