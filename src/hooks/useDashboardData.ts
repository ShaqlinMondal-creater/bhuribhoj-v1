"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getExpenses } from "@/services/expenseService";
import { getGuestMeals } from "@/services/guestMealService";
import { getMeals } from "@/services/mealService";
import { getMess, getSettings } from "@/services/messService";
import { getMemberUsers, getUsers } from "@/services/userService";
import type { AuthenticatedUser } from "@/auth/authTypes";
import { getStoreVersion, subscribeToStore } from "@/data/memoryStore";
import { getTodayDate } from "@/lib/dates";

// There is no members list. `users` is everyone and `members` is the subset of
// users who carry a member_id, which is what a meal is booked against. A signed
// in member sees only their own meals, found through their member_id.
export const useDashboardData = (user: AuthenticatedUser) => {
  const dataVersion = useSyncExternalStore(
    subscribeToStore,
    getStoreVersion,
    () => 0,
  );

  return useMemo(() => {
    void dataVersion;
    const allUsers = getUsers();
    const memberId = user.member_id;
    const allMeals = getMeals();
    const allExpenses = getExpenses();
    const today = getTodayDate();
    const scopedMeals = allMeals.filter((meal) => !memberId || meal.memberId === memberId);
    const todayMeals = scopedMeals.filter((meal) => meal.date === today && meal.status === "taken");
    const members = getMemberUsers();

    return {
      mess: getMess(),
      settings: getSettings(),
      members,
      meals: scopedMeals,
      guestMeals: getGuestMeals().filter(
        (meal) => !memberId || meal.memberId === memberId,
      ),
      expenses: allExpenses,
      users: allUsers,
      activeUsers: allUsers.filter((user) => user.status).length,
      todayLunch: todayMeals.filter((meal) => meal.mealType === "lunch").length,
      todayDinner: todayMeals.filter((meal) => meal.mealType === "dinner").length,
      fixedExpenses: allExpenses.filter((expense) => expense.type === "fixed").reduce((sum, expense) => sum + expense.amount, 0),
      marketExpenses: allExpenses.filter((expense) => expense.type === "market").reduce((sum, expense) => sum + expense.amount, 0),
    };
  }, [user, dataVersion]);
};
