export const errorHandler = (err, req, res, next) => {
  if(process.env.NODE_ENV === "development"){
    if (err?.originalError) {
      console.log(err.originalError);
    } else {
      console.log(err.stack); 
    }
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message,
    errorCode: err.errorCode || "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};