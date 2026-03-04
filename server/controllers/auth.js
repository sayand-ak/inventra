import authService from "../services/auth.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    return res.status(200).json({
      message: "Login successful",
      data: result,
    });

  } catch (error) {
    return res.status(400).json({
      message: error.message || "Login failed",
    });
  }
};