import React, { createContext, useState, useCallback, useMemo } from "react";

export const ChallengeListContext = createContext({
    challenges: [],
    setChallenges: () => {},
    cachedChallenges: {},
    setCachedChallenges: () => {},
    pagination: {},
    setPagination: () => {},
    demographics: {
        total_challenges: null,
        total_easy: null,
        total_medium: null,
        total_hard: null,
        total_active: null,
        total_inactive: null,
    },
    setDemographics: () => {},
    filters: { search: "", difficulties: [], statuses: [] },
    setFilters: () => {},
    rowsPerPage: 10,
    setRowsPerPage: () => {},
    sortBy: null,
    setSortBy: () => {},
    resetState: () => {},
});

export const ChallengeListProvider = ({ children }) => {
    const [challenges, setChallenges] = useState([]);
    const [cachedChallenges, setCachedChallenges] = useState({});
    const [pagination, setPagination] = useState({});
    const [demographics, setDemographics] = useState({
        total_challenges: null,
        total_easy: null,
        total_medium: null,
        total_hard: null,
        total_active: null,
        total_inactive: null,
    });
    const [filters, setFilters] = useState({
        search: "",
        difficulties: [],
        statuses: [],
    });
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState(null);

    const resetState = useCallback(() => {
        setChallenges([]);
        setCachedChallenges({});
        setPagination({});
        setDemographics({
            total_challenges: null,
            total_easy: null,
            total_medium: null,
            total_hard: null,
            total_active: null,
            total_inactive: null,
        });
        setFilters({ search: "", difficulties: [], statuses: [] });
        setRowsPerPage(10);
        setSortBy(null);
    }, []);

    const contextValue = useMemo(
        () => ({
            challenges,
            setChallenges,
            cachedChallenges,
            setCachedChallenges,
            pagination,
            setPagination,
            demographics,
            setDemographics,
            filters,
            setFilters,
            rowsPerPage,
            setRowsPerPage,
            sortBy,
            setSortBy,
            resetState,
        }),
        [
            challenges,
            cachedChallenges,
            pagination,
            demographics,
            filters,
            rowsPerPage,
            sortBy,
            resetState,
        ]
    );

    return (
        <ChallengeListContext.Provider value={contextValue}>
            {children}
        </ChallengeListContext.Provider>
    );
};