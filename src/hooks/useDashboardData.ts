"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getExpenses } from "@/services/expenseService";
import { getGuestMeals } from "@/services/guestMealService";
import { getMeals } from "@/services/mealService";
import { getMembers } from "@/services/memberService";
import { getMess, getSettings } from "@/services/messService";
import { getUsers } from "@/services/userService";
import type { AuthenticatedUser } from "@/auth/authTypes";
import { getPrototypeDataVersion, subscribeToPrototypeData } from "@/lib/prototypeStorage";

export const useDashboardData = (user: AuthenticatedUser) => {
  const dataVersion = useSyncExternalStore(
    subscribeToPrototypeData,
    getPrototypeDataVersion,
    () => 0,
  );

  return useMemo(() => {
    void dataVersion;
    const allMembers = getMembers();
    const memberId = user.memberId;
    const allMeals = getMeals();
    const allExpenses = getExpenses();
    const today = "2026-09-27";
    const todayMeals = allMeals.filter((meal) => meal.date === today && meal.status === "taken");

    return {
      mess: getMess(),
      settings: getSettings(),
      members: allMembers,
      meals: allMeals.filter((meal) => !memberId || meal.memberId === memberId),
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