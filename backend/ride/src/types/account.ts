type Account = {
    accountId: string, 
    name: string,
    email: string,
    cpf: string,
    carPlate: string,
    isPassenger: boolean,
    isDriver: boolean,
    date: Date,
    isVerified: boolean,
    verificationCode: string
}

export default Account;