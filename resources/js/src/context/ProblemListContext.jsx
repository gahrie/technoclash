import React, { createContext, useState, useCallback, useMemo } from "react";

export const ProblemListContext = createContext({
    problems: [],
    setProblems: () => {},
    cachedProblems: {},
    setCachedProblems: () => {},
    pagination: {},
    setPagination: () => {},
    demographics: {
        total_problems: null,
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

export const ProblemListProvider = ({ children }) => {
    const [problems, setProblems] = useState([]);
    const [cachedProblems, setCachedProblems] = useState({});
    const [pagination, setPagination] = useState({});
    const [demographics, setDemographics] = useState({
        total_problems: null,
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
        setProblems([]);
        setCachedProblems({});
        setPagination({});
        setDemographics({
            total_problems: null,
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
            problems,
            setProblems,
            cachedProblems,
            setCachedProblems,
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
            problems,
            cachedProblems,
            pagination,
            demographics,
            filters,
            rowsPerPage,
            sortBy,
            resetState,
        ]
    );

    return (
        <ProblemListContext.Provider value={contextValue}>
            {children}
        </ProblemListContext.Provider>
    );
};