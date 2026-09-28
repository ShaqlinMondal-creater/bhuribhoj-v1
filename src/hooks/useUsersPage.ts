"use client";

import { useEffect, useState } from "react";
import { useCollectionQuery } from "@/hooks/useCollection";
import { queryUsers } from "@/services/userService";
import type { CollectionQuery } from "@/data/collections";
import type { PublicUser } from "@/types/user";

// The users table is the one place the collection is genuinely too big to hand
// to the browser, so it is the one place that asks the server to do the work.
// Every control on this bar is a request: typing searches, each filter narrows,
// and each page is fetched. Nothing is narrowed in React.

const PAGE_SIZE = 10;

/** How long a keystroke has to settle before it becomes a request. */
const SEARCH_DEBOUNCE_MS = 300;

/** The largest member list a picker needs; the server caps the page size anyway. */
const MEMBER_PAGE_SIZE = 200;

/**
 * One page of users, searched and filtered by the server.
 *
 * The caller passes `enabled` so the request is only made once the Users view is
 * actually on screen and the signed-in role is allowed to see it.
 */
export const useUsersPage = (enabled: boolean) => {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  // One request per pause in typing, not one per keystroke. Settling on the
  // same text is a no-op, so the first render sends nothing.
  useEffect(() => {
    const trimmed = searchText.trim();
    const timer = window.setTimeout(() => {
      setSearch(trimmed);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const query: CollectionQuery = {
    page,
    limit: PAGE_SIZE,
    ...(search === "" ? {} : { search }),
    ...(role === "all" ? {} : { role }),
    ...(status === "all" ? {} : { status: status === "active" }),
  };

  const result = useCollectionQuery<PublicUser[]>("users", query, enabled);

  // The server pulls a page number past the end back to the last page that
  // exists, so the rows on screen are never empty just because a record went
  // away. The pager is given that same clamped number, so the two agree.
  const lastPage = result.meta?.totalPages ?? 1;
  const visiblePage = Math.min(page, lastPage);

  return {
    searchText,
    setSearchText,
    changeRole: (value: string) => {
      setRole(value);
      setPage(1);
    },
    changeStatus: (value: string) => {
      setStatus(value);
      setPage(1);
    },
    role,
    status,
    page: visiblePage,
    setPage,
    pageSize: PAGE_SIZE,
    rows: result.data ?? [],
    // The counts come from the whole collection, so the cards above the table do
    // not jump around as a filter is applied.
    counts: result.meta?.counts ?? { total: 0, active: 0, entryFeePending: 0 },
    // How many records match the search and filters, which is what the table
    // footer reports.
    total: result.meta?.total ?? 0,
    lastPage,
    loading: result.status === "loading",
    error: result.error,
    reload: result.reload,
  };
};

/**
 * The people a meal can be booked to.
 *
 * A meal stores a member_id, so this is the subset of users who carry one. It is
 * requested on its own rather than by loading every user, and only by the views
 * that actually offer a member to choose.
 */
export const useMembers = (enabled: boolean) => {
  const [state, setState] = useState<{
    members: PublicUser[];
    error: string;
    loaded: boolean;
  }>({ members: [], error: "", loaded: false });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    queryUsers({ role: "member", page: 1, limit: MEMBER_PAGE_SIZE })
      .then((page) => {
        if (active) setState({ members: page.data, error: "", loaded: true });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setState({
          members: [],
          error: cause instanceof Error ? cause.message : "Could not load the member list.",
          loaded: true,
        });
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return { members: state.members, loading: enabled && !state.loaded, error: state.error };
};
