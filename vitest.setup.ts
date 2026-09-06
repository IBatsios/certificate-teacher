// Loads .env so the data-access tests reach the compose database. In CI the
// job sets DATABASE_URL itself and there is no .env; dotenv then does nothing.
import "dotenv/config";
