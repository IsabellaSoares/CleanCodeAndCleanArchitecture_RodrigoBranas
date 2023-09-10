import AccountService from "../src/AccountService";

test("Deve criar um passageiro", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705552",
		isPassenger: true
	}
	const accountService = new AccountService();
	const output = await accountService.signup(input);
	const account = await accountService.getAccount(output.accountId);
	expect(account.account_id).toBeDefined();
	expect(account.name).toBe(input.name);
	expect(account.email).toBe(input.email);
	expect(account.cpf).toBe(input.cpf);
});

test("Não deve criar um passageiro com cpf inválido", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705500",
		isPassenger: true
	}
	const accountService = new AccountService();
	await expect(() => accountService.signup(input)).rejects.toThrow(new Error("Invalid cpf"));
});

test("Não deve criar um passageiro com nome inválido", async function () {
	const input = {
		name: "John",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705552",
		isPassenger: true
	}
	const accountService = new AccountService();
	await expect(() => accountService.signup(input)).rejects.toThrow(new Error("Invalid name"));
});

test("Não deve criar um passageiro com email inválido", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@`,
		cpf: "95818705552",
		isPassenger: true
	}
	const accountService = new AccountService();
	await expect(() => accountService.signup(input)).rejects.toThrow(new Error("Invalid email"));
});

test("Não deve criar um passageiro com conta existente", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705552",
		isPassenger: true
	}
	const accountService = new AccountService();
	await accountService.signup(input)
	await expect(() => accountService.signup(input)).rejects.toThrow(new Error("Account already exists"));
});

test("Deve criar um motorista", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705552",
		carPlate: "AAA9999",
		isDriver: true
	}
	const accountService = new AccountService();
	const output = await accountService.signup(input);
	expect(output.accountId).toBeDefined();
});

test("Não deve criar um motorista com place do carro inválida", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705552",
		carPlate: "AAA999",
		isDriver: true
	}
	const accountService = new AccountService();
	await expect(() => accountService.signup(input)).rejects.toThrow(new Error("Invalid plate"));
});

test("Deve criar uma corrida", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705552",
		isPassenger: true
	}
	const accountService = new AccountService();
	const output = await accountService.signup(input);
	const account = await accountService.getAccount(output.accountId);
	const from = {
		lat: 0,
		long: 0
	}
	const to = {
		lat: 1,
		long: 1
	}
	const { rideId } = await accountService.request_ride(account.account_id, from, to);
	const ride = await accountService.getRide(rideId);
	expect(ride.ride_id).toBeDefined();
	expect(ride.passenger_id).toBe(account.account_id);
	expect(ride.driver_id).toBeNull();
	expect(ride.status).toBe('requested');
	expect(ride.distance).toBeNull();
	expect(ride.from_lat).toBe(from.lat.toString());
	expect(ride.from_long).toBe(from.long.toString());
	expect(ride.to_lat).toBe(to.lat.toString());
	expect(ride.to_long).toBe(to.long.toString());
});

test("Não deve solicitar uma corrida caso o usuário não seja um passageiro", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705552",
		isPassenger: false
	}
	const accountService = new AccountService();
	const notPassenger = await accountService.signup(input);
	const from = {
		lat: 0,
		long: 0
	}
	const to = {
		lat: 1,
		long: 1
	}
	await expect(() => accountService.request_ride(notPassenger.accountId, from, to)).rejects.toThrow(new Error("This user is not a passenger"));
	await accountService.deletePassenger(notPassenger.accountId);
});

test("Não deve solicitar uma corrida caso o passageiro tenha uma corrida que ainda não foi completada", async function () {
	const input = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "95818705552",
		isPassenger: true
	}
	const accountService = new AccountService();
	const passenger = await accountService.signup(input);
	const from = {
		lat: 0,
		long: 0
	}
	const to = {
		lat: 1,
		long: 1
	}
	await accountService.request_ride(passenger.accountId, from, to);
	await expect(() => accountService.request_ride(passenger.accountId, from, to)).rejects.toThrow(new Error("This passenger already has an active ride"));
	await accountService.deletePassenger(passenger.accountId);
});