export type MealType = "lunch" | "dinner";

export type Meal = {
	id: string;
	memberId: string;
	date: string;
	mealType: MealType;
	status: "taken" | "cancelled";
	createdAt?: string;
	updatedAt?: string;
};

export type GuestMeal = {
	id: string;
	memberId: string;
	guestName: string;
	date: string;
	thaliType: "fish-thali" | "chicken-thali" | "veg-thali" | "egg-thali";
	price: number;
	status: "confirmed" | "cancelled";
	createdAt?: string;
	updatedAt?: string;
};