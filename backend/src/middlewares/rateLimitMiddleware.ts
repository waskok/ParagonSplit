import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Zbyt wiele prób logowania lub rejestracji. Spróbuj za 15 minut." }
});

export const scanRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Zbyt wiele skanów w krótkim czasie. Spróbuj za chwilę." }
});
