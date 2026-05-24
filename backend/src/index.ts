import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`ParagonSplit backend scaffold listening on port ${PORT}`);
});
