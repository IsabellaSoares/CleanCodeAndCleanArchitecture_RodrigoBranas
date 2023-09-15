import databaseConfig from "./database/connection";
import type Account from "./types/account";

const pgp = require("pg-promise")({});

export default class AccountDAO {
    constructor () {}

    async save (account: Partial<Account>) {
        const connection = pgp(databaseConfig);
        await connection.query("insert into cccat13.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver, date, is_verified, verification_code) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [account.accountId, account.name, account.email, account.cpf, account.carPlate, !!account.isPassenger, !!account.isDriver, account.date, false, account.verificationCode]);
        await connection.$pool.end();
    }

    async getByEmail (email: string) {
        const connection = pgp(databaseConfig);
        const [accountData] = await connection.query("select * from cccat13.account where email = $1", [email]);
        await connection.$pool.end();
        return accountData;
    }

    async getById (accountId: string) {
        const connection = pgp(databaseConfig);
        const [accountData] = await connection.query("select * from cccat13.account where account_id = $1", [accountId]);
        await connection.$pool.end();
        return accountData;
    }
}