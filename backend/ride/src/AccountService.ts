import crypto from "crypto";
import CpfValidator from "./CpfValidator";
import databaseConfig from "./database/connection";
import type Ride from "./types/ride";

const pgp = require("pg-promise")({});

export default class AccountService {
	cpfValidator: CpfValidator;

	constructor () {
		this.cpfValidator = new CpfValidator();
	}

	async sendEmail (email: string, subject: string, message: string) {
		console.log(email, subject, message);
	}

	async signup (input: any) {
		const connection = pgp(databaseConfig);
		try {
			const accountId = crypto.randomUUID();
			const verificationCode = crypto.randomUUID();
			const date = new Date();
			const [existingAccount] = await connection.query("select * from cccat13.account where email = $1", [input.email]);
			if (existingAccount) throw new Error("Account already exists");
			if (!input.name.match(/[a-zA-Z] [a-zA-Z]+/)) throw new Error("Invalid name");
			if (!input.email.match(/^(.+)@(.+)$/)) throw new Error("Invalid email");
			if (!this.cpfValidator.validate(input.cpf)) throw new Error("Invalid cpf");
			if (input.isDriver && !input.carPlate.match(/[A-Z]{3}[0-9]{4}/)) throw new Error("Invalid plate");
			await connection.query("insert into cccat13.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver, date, is_verified, verification_code) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [accountId, input.name, input.email, input.cpf, input.carPlate, !!input.isPassenger, !!input.isDriver, date, false, verificationCode]);
			await this.sendEmail(input.email, "Verification", `Please verify your code at first login ${verificationCode}`);
			return {
				accountId
			}
		} finally {
			await connection.$pool.end();
		}
	}

	async getAccount (accountId: string) {
		const connection = pgp(databaseConfig);
		const [account] = await connection.query("select * from cccat13.account where account_id = $1", [accountId]);
		await connection.$pool.end();
		return account;
	}

	async request_ride (passengerId: string, from: { lat: number, long: number }, to: { lat: number, long: number }) {
		const connection = pgp(databaseConfig);
		try {
			const account = await this.getAccount(passengerId);
			if (!account.is_passenger) throw new Error('This user is not a passenger');
			let rideAlredyExists = await this.getRidesByPassengerId(passengerId);
			rideAlredyExists = rideAlredyExists.find((ride: Ride) => ride.status !== 'completed');
			if (rideAlredyExists) throw new Error('This passenger already has an active ride');
			const rideId = crypto.randomUUID();
			const date = new Date();
			await connection.query("insert into cccat13.ride (ride_id, passenger_id, driver_id, status, fare, distance, from_lat, from_long, to_lat, to_long, date) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", [rideId, passengerId, null, "requested", null, null, from.lat, from.long, to.lat, to.long, date]);
			return {
				rideId
			}
		} finally {
			await connection.$pool.end();
		}
	}

	async accept_ride () {}

	async getRide (rideId: string) {
		const connection = pgp(databaseConfig);
		const [ride] = await connection.query("select * from cccat13.ride where ride_id = $1", [rideId]);
		await connection.$pool.end();
		return ride;
	}

	async getRidesByPassengerId (passengerId: string) {
		const connection = pgp(databaseConfig);
		const rides = await connection.query("select * from cccat13.ride where passenger_id = $1", [passengerId]);
		await connection.$pool.end();
		return rides;
	}

	async deletePassenger (passengerId: string) {
		const connection = pgp(databaseConfig);
		await connection.query("delete from cccat13.ride where passenger_id = $1", [passengerId]);
		await connection.query("delete from cccat13.account where account_id = $1", [passengerId]);
		await connection.$pool.end();
	}
}
