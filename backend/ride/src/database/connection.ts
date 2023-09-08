import * as dotenv from 'dotenv';

dotenv.config();

const databaseConfig= {
  "host": process.env.POSTGRES_HOST,
  "port": process.env.POSTGRES_PORT,
  "database": process.env.POSTGRES_DATABASE,
  "user": process.env.POSTGRES_USER
};

export default databaseConfig;
