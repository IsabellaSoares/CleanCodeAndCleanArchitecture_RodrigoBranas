type Ride = {
    ride_id: string,
	passenger_id: string,
	driver_id: string,
	status: 'requested' | 'completed' | 'accepted' | 'in_progress',
	fare: Number,
	distance: Number,
	from_lat: Number,
	from_long: Number,
	to_lat: Number,
	to_long: Number,
	date: Date
}

export default Ride;