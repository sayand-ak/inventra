import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach values to request
    req.userId = decoded.userId;
    req.email = decoded.email;
    req.isAdmin = decoded.isAdmin;
    req.isShopKeeper = decoded.isShopKeeper;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};