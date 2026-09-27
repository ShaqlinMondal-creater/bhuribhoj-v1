"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getExpenses } from "@/services/expenseService";
import { getGuestMeals } from "@/services/guestMealService";
import { getMeals } from "@/services/mealService";
import { getMembers } from "@/services/memberService";
import { getMess, getSettings } from "@/services/messService";
import { getUsers } from "@/services/userService";
import type { AuthenticatedUser } from "@/auth/authTypes";
import { getStoreVersion, subscribeToStore } from "@/data/memoryStore";
import { getTodayDate } from "@/lib/dates";

export const useDashboardData = (user: AuthenticatedUser) => {
  const dataVersion = useSyncExternalStore(
    subscribeToStore,
    getStoreVersion,
    () => 0,
  );

  return useMemo(() => {
    void dataVersion;
    const allMembers = getMembers();
    const memberId = user.memberId;
    const allMeals = getMeals();
    const allExpenses = getExpenses();
    const today = getTodayDate();
    const scopedMeals = allMeals.filter((meal) => !memberId || meal.memberId === memberId);
    const todayMeals = scopedMeals.filter((meal) => meal.date === today && meal.status === "taken");

    return {
      mess: getMess(),
      settings: getSettings(),
      members: allMembers,
      meals: scopedMeals,
      guestMeals: getGuestMeals().filter(
        (meal) => !memberId || meal.memberId === memberId,
      ),
      expenses: allExpenses,
      users: getUsers(),
      activeMembers: allMembers.filter((member) => member.status === "active").length,
      todayLunch: todayMeals.filter((meal) => meal.mealType === "lunch").length,
      todayDinner: todayMeals.filter((meal) => meal.mealType === "dinner").length,
      fixedExpenses: allExpenses.filter((expense) => expense.type === "fixed").reduce((sum, expense) => sum + expense.amount, 0),
      marketExpenses: allExpenses.filter((expense) => expense.type === "market").reduce((sum, expense) => sum + expense.amount, 0),
    };
  }, [user, dataVersion]);
};