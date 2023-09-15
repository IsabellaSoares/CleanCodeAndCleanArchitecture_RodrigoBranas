import crypto from "crypto";
import CpfValidator from "./CpfValidator";
import databaseConfig from "./database/connection";
import type Ride from "./types/ride";
import AccountDAO from "./AccountDAO";

const pgp = require("pg-promise")({});

export default class AccountService {
	cpfValidator: CpfValidator;
	accountDAO: AccountDAO;

	constructor () {
		this.cpfValidator = new CpfValidator();
		this.accountDAO = new AccountDAO();
	}

	async sendEmail (email: string, subject: string, message: string) {
		console.log(email, subject, message);
	}

	async signup (input: any) {
		input.accountId = crypto.randomUUID();
		input.verificationCode = crypto.randomUUID();
		input.date = new Date();
		const existingAccount = await this.accountDAO.getByEmail(input.email);
		if (existingAccount) throw new Error("Account already exists");
		if (!input.name.match(/[a-zA-Z] [a-zA-Z]+/)) throw new Error("Invalid name");
		if (!input.email.match(/^(.+)@(.+)$/)) throw new Error("Invalid email");
		if (!this.cpfValidator.validate(input.cpf)) throw new Error("Invalid cpf");
		if (input.isDriver && !input.carPlate.match(/[A-Z]{3}[0-9]{4}/)) throw new Error("Invalid plate");
		await this.accountDAO.save(input);
		await this.sendEmail(input.email, "Verification", `Please verify your code at first login ${input.verificationCode}`);
		return {
			accountId: input.accountId
		}
	}

	async getAccount (accountId: string) {
		const account = await this.accountDAO.getById(accountId);
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

	async accept_ride (driverId: string, rideId: string) {
		const connection = pgp(databaseConfig);
		try {
			const account = await this.getAccount(driverId);
			if (!account.is_driver) throw new Error('This user is not a driver');
			let requestedRide = await this.getRide(rideId);
			if (requestedRide.status !== 'requested') throw new Error('This ride is not requested or is invalid');
			const driverRides = await this.getRidesByDriverId(driverId);
			const driverAlreadyAcceptedRide = driverRides.find((ride: Ride) => ride.status === 'accepted' || ride.status === 'in_progress');
			if (driverAlreadyAcceptedRide) throw new Error('This driver already has a ride in progress');
			await this.acceptRide(rideId, driverId);
		} finally {
			await connection.$pool.end();
		}
	}

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

	async getRidesByDriverId (driverId: string) {
		const connection = pgp(databaseConfig);
		const rides = await connection.query("select * from cccat13.ride where driver_id = $1", [driverId]);
		await connection.$pool.end();
		return rides;
	}

	async acceptRide (rideId: string, driverId: string) {
		const connection = pgp(databaseConfig);
		await connection.query("update cccat13.ride set status = 'accepted', driver_id = $1 where ride_id = $2", [driverId, rideId]);
		await connection.$pool.end();
	}

	async deletePassenger (passengerId: string) {
		const connection = pgp(databaseConfig);
		await connection.query("delete from cccat13.ride where passenger_id = $1 OR driver_id = $1", [passengerId]);
		await connection.query("delete from cccat13.account where account_id = $1", [passengerId]);
		await connection.$pool.end();
	}
}
